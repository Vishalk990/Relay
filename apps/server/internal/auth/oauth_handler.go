package auth

import (
	"context"
	"errors"
	"net/http"
	"relay-backend/internal/db"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

// GitHubLogin starts the OAuth flow: generate state, save it as a cookie,
// and redirect the browser to GitHub's authorize URL.
func (h *Handler) GitHubLogin(c echo.Context) error {
	state, err := GenerateOAuthState()
	if err != nil {
		h.log.Error("gen oauth state failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	SetOAuthStateCookie(c.Response().Writer, state, h.auth.CookieSecure())
	authURL := h.githubOAuth.AuthCodeURL(state)
	return c.Redirect(http.StatusFound, authURL)
}

// GitHubCallback receives the redirect from GitHub:
//   - Verify state (CSRF protection)
//   - Exchange the code for a token and fetch the user profile
//   - Look up / link / create the user in our DB
//   - Issue our JWT cookie and redirect to the frontend
func (h *Handler) GitHubCallback(c echo.Context) error {
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

	ghUser, err := FetchGitHubUser(ctx, h.githubOAuth, code)
	if err != nil {
		h.log.Error("fetch github user failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusBadGateway, "github auth failed")
	}

	user, err := h.resolveOrCreateOAuthUser(
		ctx,
		"github",
		strconv.FormatInt(ghUser.ID, 10),
		ghUser.Email,
		ghUser.Login,
	)
	if err != nil {
		h.log.Error("resolve oauth user failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	if err := h.auth.IssueAndSet(c.Response().Writer, uuidToString(user.ID)); err != nil {
		h.log.Error("issue cookie failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	return c.Redirect(http.StatusFound, h.frontendURL)
}

// resolveOrCreateOAuthUser handles the three branches of OAuth login:
//  1. Existing identity for this provider+subject → return that user
//  2. Email matches an existing user → link the new identity to them
//  3. Brand new → create user + identity in a single transaction
//
// Reusable for any OAuth provider (Google next).
func (h *Handler) resolveOrCreateOAuthUser(
	ctx context.Context,
	provider, providerSubject, email, defaultUsername string,
) (*db.User, error) {
	// 1. Existing identity?
	identity, err := h.queries.GetIdentityByProviderSubject(ctx, db.GetIdentityByProviderSubjectParams{
		Provider:        provider,
		ProviderSubject: providerSubject,
	})
	if err == nil {
		user, err := h.queries.GetUserByID(ctx, identity.UserID)
		if err != nil {
			return nil, err
		}
		return &user, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	// 2. Email matches existing user → link.
	existing, err := h.queries.GetUserByEmail(ctx, email)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	if err == nil {
		_, err := h.queries.CreateIdentity(ctx, db.CreateIdentityParams{
			UserID:          existing.ID,
			Provider:        provider,
			ProviderSubject: providerSubject,
			Credential:      pgtype.Text{Valid: false}, // NULL — no password for OAuth
		})
		if err != nil {
			return nil, err
		}
		return &existing, nil
	}

	// 3. Brand new user — create user + identity atomically.
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	qtx := h.queries.WithTx(tx)

	username := defaultUsername
	user, err := qtx.CreateUser(ctx, db.CreateUserParams{
		Username: username,
		Email:    email,
	})
	if err != nil && isUniqueViolation(err) {
		// Username collision (email collision was handled in step 2).
		// Retry once with a short random suffix.
		suffix, sErr := newJTI()
		if sErr != nil {
			return nil, sErr
		}
		username = defaultUsername + "-" + suffix[:4]
		user, err = qtx.CreateUser(ctx, db.CreateUserParams{
			Username: username,
			Email:    email,
		})
	}
	if err != nil {
		return nil, err
	}

	if _, err := qtx.CreateIdentity(ctx, db.CreateIdentityParams{
		UserID:          user.ID,
		Provider:        provider,
		ProviderSubject: providerSubject,
		Credential:      pgtype.Text{Valid: false},
	}); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &user, nil
}
