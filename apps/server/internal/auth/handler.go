package auth

import (
	"errors"
	"net/http"
	"relay-backend/internal/db"
	"strings"

	"github.com/google/uuid"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type Handler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
	log     *zap.Logger
	auth    *Authenticator
}

func NewHandler(pool *pgxpool.Pool, log *zap.Logger, auth *Authenticator) *Handler {
	return &Handler{
		pool:    pool,
		queries: db.New(pool),
		log:     log,
		auth:    auth,
	}
}

type SignupReqeust struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Signup(c echo.Context) error {
	var req SignupReqeust
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid req body")
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if req.Username == "" || req.Email == "" || req.Password == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username, email, and password are required")
	}
	if !strings.Contains(req.Email, "@") {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid email")
	}
	if len(req.Password) < 8 {
		return echo.NewHTTPError(http.StatusBadRequest, "password must be at least 8 characters")
	}
	hash, err := HashPassword(req.Password)
	if err != nil {
		h.log.Error("hash password failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	ctx := c.Request().Context()

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		h.log.Error("begin tx failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	defer tx.Rollback(ctx)

	qtx := h.queries.WithTx(tx)

	user, err := qtx.CreateUser(ctx, db.CreateUserParams{
		Username: req.Username,
		Email:    req.Email,
	})
	if err != nil {
		if isUniqueViolation(err) {
			return echo.NewHTTPError(http.StatusConflict, "username or email already in use")
		}
		h.log.Error("create user failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	_, err = qtx.CreateIdentity(ctx, db.CreateIdentityParams{
		UserID:          user.ID,
		Provider:        "password",
		ProviderSubject: req.Email,
		Credential:      pgtype.Text{String: hash, Valid: true},
	})
	if err != nil {
		h.log.Error("create identity failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	if err := tx.Commit(ctx); err != nil {
		h.log.Error("commit failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	if err := h.auth.IssueAndSet(c.Response().Writer, uuidToString(user.ID)); err != nil {
		h.log.Error("issue cookie failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	return c.JSON(http.StatusCreated, map[string]any{"user": user})
}

func (h *Handler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid req body")
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" || req.Password == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email and password are required")
	}

	ctx := c.Request().Context()

	identity, err := h.queries.GetIdentityByProviderSubject(ctx, db.GetIdentityByProviderSubjectParams{
		Provider:        "password",
		ProviderSubject: req.Email,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials")
		}
		h.log.Error("lookup identity failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	if !identity.Credential.Valid || !VerifyPassword(identity.Credential.String, req.Password) {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials")
	}

	user, err := h.queries.GetUserByID(ctx, identity.UserID)
	if err != nil {
		h.log.Error("load user failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	if err := h.auth.IssueAndSet(c.Response().Writer, uuidToString(user.ID)); err != nil {
		h.log.Error("issue cookie failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	return c.JSON(http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) Me(c echo.Context) error {
	userIDStr := UserIDFromContext(c)
	if userIDStr == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "not authenticated")
	}

	userID, err := stringToUUID(userIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}

	user, err := h.queries.GetUserByID(c.Request().Context(), userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusUnauthorized, "user not found")
		}
		h.log.Error("load user failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	return c.JSON(http.StatusOK, map[string]any{"user": user})
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}

func (h *Handler) Logout(c echo.Context) error {
	h.auth.Clear(c.Response().Writer)
	return c.NoContent(http.StatusNoContent)
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return uuid.UUID(u.Bytes).String()
}

// stringToUUID parses a canonical UUID string back into a pgtype.UUID.
func stringToUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		return u, err
	}
	return u, nil
}
