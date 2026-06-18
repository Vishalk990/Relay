package environments

import (
	"errors"
	"net/http"
	"relay-backend/internal/auth"
	"relay-backend/internal/db/sqlc"
	"relay-backend/internal/pgconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

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
	wsID, err := pgconv.ParseUUID(workspaceID)
	if err != nil {
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

func (h *Handler) ensureEnvironmentOwner(c echo.Context, envID string) (sqlc.Environment, error) {
	userID, err := auth.MustUserId(c)
	if err != nil {
		return sqlc.Environment{}, err
	}
	id, err := pgconv.ParseUUID(envID)
	if err != nil {
		return sqlc.Environment{}, echo.NewHTTPError(http.StatusBadRequest, "invalid environment id")
	}
	e, err := h.queries.GetEnvironmentForUser(c.Request().Context(),
		sqlc.GetEnvironmentForUserParams{ID: id, OwnerID: userID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sqlc.Environment{}, echo.NewHTTPError(http.StatusNotFound, "environment not found")
		}
		h.log.Error("environment ownership check failed", zap.Error(err))
		return sqlc.Environment{}, echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return e, nil
}

func (h *Handler) CreateInWorkspace(c echo.Context) error {
	wsID, err := h.ensureWorkspaceOwner(c, c.Param("wid"))
	if err != nil {
		return err
	}
	var in envInput
	if err := c.Bind(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid req body")
	}
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}
	e, err := h.queries.CreateEnvironment(c.Request().Context(), sqlc.CreateEnvironmentParams{
		WorkspaceID: wsID,
		Name:        in.Name,
		Variables:   defaultJSON(in.Variables, "[]"),
	})
	if err != nil {
		h.log.Error("create environment failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusCreated, map[string]any{"environment": toDTO(e)})
}

func (h *Handler) ListInWorkspace(c echo.Context) error {
	wsID, err := h.ensureWorkspaceOwner(c, c.Param("wid"))
	if err != nil {
		return err
	}
	list, err := h.queries.ListEnvironmentsByWorkspace(c.Request().Context(), wsID)
	if err != nil {
		h.log.Error("list environments failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	dtos := make([]environmentDTO, len(list))
	for i, e := range list {
		dtos[i] = toDTO(e)
	}
	return c.JSON(http.StatusOK, map[string]any{"environments": dtos})
}

func (h *Handler) Get(c echo.Context) error {
	e, err := h.ensureEnvironmentOwner(c, c.Param("id"))
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, map[string]any{"environment": toDTO(e)})
}

func (h *Handler) Update(c echo.Context) error {
	existing, err := h.ensureEnvironmentOwner(c, c.Param("id"))
	if err != nil {
		return err
	}
	var in envInput
	if err := c.Bind(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid req body")
	}
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}
	e, err := h.queries.UpdateEnvironment(c.Request().Context(), sqlc.UpdateEnvironmentParams{
		ID:        existing.ID,
		Name:      in.Name,
		Variables: defaultJSON(in.Variables, "[]"),
	})
	if err != nil {
		h.log.Error("update environment failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusOK, map[string]any{"environment": toDTO(e)})
}

func (h *Handler) Delete(c echo.Context) error {
	e, err := h.ensureEnvironmentOwner(c, c.Param("id"))
	if err != nil {
		return err
	}
	if err := h.queries.DeleteEnvironment(c.Request().Context(), e.ID); err != nil {
		h.log.Error("delete environment failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.NoContent(http.StatusNoContent)
}
