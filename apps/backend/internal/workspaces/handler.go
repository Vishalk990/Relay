package workspaces

import (
	"errors"
	"net/http"
	"relay-backend/internal/auth"
	"relay-backend/internal/db/sqlc"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type CreateRequest struct {
	Name string `json:"name"`
}

type Handler struct {
	pool    *pgxpool.Pool
	queries *sqlc.Queries
	log     *zap.Logger
}

func NewHandler(pool *pgxpool.Pool, log *zap.Logger) *Handler {
	return &Handler{
		pool:    pool,
		queries: sqlc.New(pool),
		log:     log,
	}
}

func (h *Handler) List(c echo.Context) error {
	userId, err := auth.MustUserId(c)
	if err != nil {
		return err
	}

	list, err := h.queries.ListWorkspacesForUser(c.Request().Context(), userId)
	if err != nil {
		h.log.Error("list workspaces failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusOK, map[string]any{"workspaces": list})
}

func (h *Handler) Create(c echo.Context) error {
	userId, err := auth.MustUserId(c)
	if err != nil {
		return err
	}
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid req body")
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}

	ws, err := h.queries.CreateWorkspace(c.Request().Context(), sqlc.CreateWorkspaceParams{
		OwnerID: userId,
		Name:    req.Name,
	})
	if err != nil {
		h.log.Error("create workspace failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusCreated, map[string]any{"workspace": ws})
}

func (h *Handler) Get(c echo.Context) error {
	userID, err := auth.MustUserId(c)
	if err != nil {
		return err
	}
	var wsID pgtype.UUID
	if err := wsID.Scan(c.Param("id")); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid workspace id")
	}
	ws, err := h.queries.GetWorkspaceByID(c.Request().Context(), sqlc.GetWorkspaceByIDParams{
		ID:      wsID,
		OwnerID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "workspace not found")
		}
		h.log.Error("get workspace failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusOK, map[string]any{"workspace": ws})
}

func (h *Handler) Update(c echo.Context) error {
	userID, err := auth.MustUserId(c)
	if err != nil {
		return err
	}
	var wsID pgtype.UUID
	if err := wsID.Scan(c.Param("id")); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid workspace id")
	}
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid req body")
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}

	ws, err := h.queries.UpdateWorkspace(c.Request().Context(), sqlc.UpdateWorkspaceParams{
		ID:      wsID,
		OwnerID: userID,
		Name:    req.Name,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "workspace not found")
		}
		h.log.Error("update workspace failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusOK, map[string]any{"workspace": ws})
}

func (h *Handler) Delete(c echo.Context) error {
	userID, err := auth.MustUserId(c)
	if err != nil {
		return err
	}
	var wsID pgtype.UUID
	if err := wsID.Scan(c.Param("id")); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid workspace id")
	}

	if err := h.queries.DeleteWorkspace(c.Request().Context(), sqlc.DeleteWorkspaceParams{
		ID:      wsID,
		OwnerID: userID,
	}); err != nil {
		h.log.Error("delete workspace failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.NoContent(http.StatusNoContent)
}
