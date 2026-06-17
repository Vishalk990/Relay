package auth

import (
	"context"
	"errors"
	"net/http"
	"relay-backend/internal/db/sqlc"
	"relay-backend/internal/pgconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

func (h *Handler) GoogleLogin(c echo.Context) error {
	state, err := GenerateOAuthState()
	if err != nil {
		h.log.Error("gen oauth state failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	SetOAuthStateCookie(c.Response().Writer, state, h.auth.CookieSecure())
	return c.Redirect(http.StatusFound, h.googleOAuth.AuthCodeURL(state))
}

func (h *Handler) GoogleCallback(c echo.Context) error {
	if err := VerifyOAuthState(c); err != nil {
		h.log.Warn("oauth state verify failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusBadRequest, "invalid state")
	}
	ClearOAuthStateCookie(c.Response().Writer, h.auth.CookieSecure())

	code := c.QueryParam("code")
	if code == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "missing code")
	}
	ctx := c.Request().Context()
	gUser, err := FetchGoogleUser(ctx, h.googleOAuth, code)
	if err != nil {
		h.log.Error("fetch google user failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusBadGateway, "google auth failed")
	}
	user, err := h.resolveOrCreateOAuthUser(ctx, "google", gUser.Sub, gUser.Email, gUser.Name)
	if err != nil {
		h.log.Error("resolve oauth user failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")

	}
	if err := h.auth.IssueAndSet(c.Response().Writer, pgconv.UUIDString(user.ID)); err != nil {
		h.log.Error("issue cookie failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.Redirect(http.StatusFound, h.frontendURL)

}

func (h *Handler) resolveOrCreateOAuthUser(ctx context.Context, provider, providerSubject, email, defaultUsername string) (*sqlc.User, error) {
	identity, err := h.queries.GetIdentityByProviderSubject(ctx, sqlc.GetIdentityByProviderSubjectParams{
		Provider: provider, ProviderSubject: providerSubject,
	})
	if err == nil {
		user, err := h.queries.GetUser(ctx, identity.UserID)
		if err != nil {
			return nil, err
		}
		return &user, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	existing, err := h.queries.GetUserByEmail(ctx, email)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	if err == nil {
		if _, err := h.queries.CreateIdentity(ctx, sqlc.CreateIdentityParams{
			UserID: existing.ID, Provider: provider, ProviderSubject: providerSubject,
			Credential: pgtype.Text{Valid: false},
		}); err != nil {
			return nil, err
		}
		return &existing, nil
	}
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	qtx := h.queries.WithTx(tx)

	username := defaultUsername
	user, err := qtx.CreateUser(ctx, sqlc.CreateUserParams{
		Username: username, Email: email,
	})
	if err != nil && isUniqueViolation(err) {
		suffix, sErr := newJTI()
		if sErr != nil {
			return nil, sErr
		}
		username = defaultUsername + "-" + suffix[:4]
		user, err = qtx.CreateUser(ctx, sqlc.CreateUserParams{Username: username, Email: email})
	}
	if err != nil {
		return nil, err
	}
	if _, err := qtx.CreateIdentity(ctx, sqlc.CreateIdentityParams{
		UserID: user.ID, Provider: provider, ProviderSubject: providerSubject,
		Credential: pgtype.Text{Valid: false},
	}); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &user, nil
}
