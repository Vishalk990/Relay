package collections

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

type CreateCollection struct {
	WorkspaceID string `json:"workspaceId"`
	ParentID    string `json:"parentId"`
	Name        string `json:"name"`
}

type Handler struct {
	pool    *pgxpool.Pool
	queries sqlc.Queries
	log     *zap.Logger
}

func NewHandler(pool *pgxpool.Pool, log *zap.Logger) *Handler {
	return &Handler{
		pool:    pool,
		queries: *sqlc.New(pool),
		log:     log,
	}
}

func (h *Handler) ensureWorkspaceOwner(c echo.Context, workspaceID string) (pgtype.UUID, error) {
	userID, err := auth.MustUserId(c)
	if err != nil {
		return pgtype.UUID{}, err
	}
	var wsID pgtype.UUID
	if err := wsID.Scan(workspaceID); err != nil {
		return pgtype.UUID{}, echo.NewHTTPError(http.StatusBadRequest, "invalid workspace id")
	}
	if _, err := h.queries.GetWorkspaceByID(c.Request().Context(), sqlc.GetWorkspaceByIDParams{
		ID:      wsID,
		OwnerID: userID,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgtype.UUID{}, echo.NewHTTPError(http.StatusNotFound, "workspace not found")
		}
		h.log.Error("workspace ownership check failed", zap.Error(err))
		return pgtype.UUID{}, echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return wsID, nil
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateCollection
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid req body")
	}

	wsID, err := h.ensureWorkspaceOwner(c, req.WorkspaceID)
	if err != nil {
		return err
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}

	// Empty parentId → NULL (top-level collection). Only parse when provided.
	var parentID pgtype.UUID
	if strings.TrimSpace(req.ParentID) != "" {
		if err := parentID.Scan(req.ParentID); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid parent id")
		}
	}

	clc, err := h.queries.CreateCollection(c.Request().Context(), sqlc.CreateCollectionParams{
		WorkspaceID: wsID,
		ParentID:    parentID, // Valid:false when empty → inserts NULL
		Name:        name,
	})
	if err != nil {
		h.log.Error("create collection failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusCreated, map[string]any{"collection": clc})
}

func (h *Handler) List(c echo.Context) error {
	wsID, err := h.ensureWorkspaceOwner(c, c.QueryParam("workspaceId"))
	if err != nil {
		return err
	}
	list, err := h.queries.ListCollectionsByWorkspace(c.Request().Context(), wsID)
	if err != nil {
		h.log.Error("list collections failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusOK, map[string]any{"collections": list})
}
