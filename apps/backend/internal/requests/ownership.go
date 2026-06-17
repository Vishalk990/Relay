package requests

import (
	"errors"
	"net/http"
	"relay-backend/internal/auth"
	"relay-backend/internal/db/sqlc"
	"relay-backend/internal/pgconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

// ensureRequestOwner verifies the request belongs to the user (request →
// collection → workspace → owner) and returns the row.
func (h *Handler) ensureRequestOwner(c echo.Context, requestID string) (sqlc.Request, error) {
	userID, err := auth.MustUserId(c)
	if err != nil {
		return sqlc.Request{}, err
	}
	rid, err := pgconv.ParseUUID(requestID)
	if err != nil {
		return sqlc.Request{}, echo.NewHTTPError(http.StatusBadRequest, "invalid request id")
	}
	r, err := h.queries.GetRequestForUser(c.Request().Context(), sqlc.GetRequestForUserParams{
		ID:      rid,
		OwnerID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sqlc.Request{}, echo.NewHTTPError(http.StatusNotFound, "request not found")
		}
		h.log.Error("request ownership check failed", zap.Error(err))
		return sqlc.Request{}, echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return r, nil
}

func (h *Handler) ensureCollectionOwner(c echo.Context, collectionID string) (pgtype.UUID, error) {
	userID, err := auth.MustUserId(c)
	if err != nil {
		return pgtype.UUID{}, err
	}
	cid, err := pgconv.ParseUUID(collectionID)
	if err != nil {
		return pgtype.UUID{}, echo.NewHTTPError(http.StatusBadRequest, "invalid collection id")
	}
	if _, err := h.queries.GetCollectionForUser(c.Request().Context(), sqlc.GetCollectionForUserParams{
		ID:      cid,
		OwnerID: userID,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgtype.UUID{}, echo.NewHTTPError(http.StatusNotFound, "collection not found")
		}
		h.log.Error("collection ownership check failed", zap.Error(err))
		return pgtype.UUID{}, echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return cid, nil
}
