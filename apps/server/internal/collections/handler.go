package collections

import (
	"errors"
	"net/http"
	"relay-backend/internal/auth"
	"relay-backend/internal/db"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type Handler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
	log     *zap.Logger
}

func NewHandler(pool *pgxpool.Pool, log *zap.Logger) *Handler {
	return &Handler{pool: pool, queries: db.New(pool), log: log}
}

type CreateRequest struct {
	Name     string  `json:"name"`
	ParentID *string `json:"parent_id"`
}

func (h *Handler) ensureOwner(c echo.Context) (wsID pgtype.UUID, err error) {
	userID, err := auth.MustUserID(c)
	if err != nil {
		return wsID, err
	}
	if err := wsID.Scan(c.Param("id")); err != nil {
		return wsID, echo.NewHTTPError(http.StatusBadRequest, "invalid workspace id")
	}
	_, err = h.queries.GetWorkspaceByID(c.Request().Context(), db.GetWorkspaceByIDParams{
		ID:      wsID,
		OwnerID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return wsID, echo.NewHTTPError(http.StatusNotFound, "workspace not found")
		}
		h.log.Error("ownership check failed", zap.Error(err))
		return wsID, echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return wsID, nil
}

func (h *Handler) Create(c echo.Context) error {
	wsID, err := h.ensureOwner(c)
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

	var parentID pgtype.UUID
	if req.ParentID != nil && *req.ParentID != "" {
		if err := parentID.Scan(*req.ParentID); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid parent id")
		}
	}

	col, err := h.queries.CreateCollection(c.Request().Context(), db.CreateCollectionParams{
		WorkspaceID: wsID,
		ParentID:    parentID,
		Name:        req.Name,
		Position:    0,
	})
	if err != nil {
		h.log.Error("create collection failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusCreated, map[string]any{"collection": col})

}

func (h *Handler) List(c echo.Context) error {
	wsID, err := h.ensureOwner(c)
	if err != nil {
		return err
	}
	list, err := h.queries.ListCollectionsInWorkspace(c.Request().Context(), wsID)
	if err != nil {
		h.log.Error("list collections failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusOK, map[string]any{"collections": list})
}
