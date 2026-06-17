package requests

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/url"
	"relay-backend/internal/auth"
	"relay-backend/internal/db/sqlc"
	"relay-backend/internal/proxy"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type Handler struct {
	pool    *pgxpool.Pool
	queries sqlc.Queries
	log     *zap.Logger
	client  *http.Client
}

func NewHandler(pool *pgxpool.Pool, log *zap.Logger) *Handler {
	return &Handler{
		pool:    pool,
		queries: *sqlc.New(pool),
		log:     log,
		client:  proxy.NewSafeClient(),
	}
}

func (h *Handler) Send(c echo.Context) error {
	if _, err := auth.MustUserId(c); err != nil {
		return err
	}
	var req sendRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid req body")
	}
	method := strings.ToUpper(strings.TrimSpace(req.Method))
	if !allowedMethods[method] {
		return echo.NewHTTPError(http.StatusBadRequest, "unsupported method")
	}
	u, err := url.Parse(strings.TrimSpace(req.URL))
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "url must be a valid http(s) URL")

	}
	ctx, cancel := context.WithTimeout(c.Request().Context(), proxy.DefaultTimeout)
	defer cancel()

	var body io.Reader

	if req.Body != "" && method != http.MethodGet && method != http.MethodHead {
		body = strings.NewReader(req.Body)
	}

	outReq, err := http.NewRequestWithContext(ctx, method, u.String(), body)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "could not build request")
	}
	for _, hd := range req.Headers {
		if hd.Enabled && strings.TrimSpace(hd.Key) != "" {
			outReq.Header.Set(hd.Key, hd.Value)
		}
	}
	start := time.Now()
	resp, err := h.client.Do(outReq)
	if err != nil {
		h.log.Warn("proxy send failed", zap.String("host", u.Host), zap.Error(err)) // host only, never body/headers
		return echo.NewHTTPError(http.StatusBadGateway, "request failed: "+cleanErr(err))
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, proxy.MaxResponseBytes))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "failed reading response")
	}
	elapsed := time.Since(start).Milliseconds()
	flat := make(map[string]string, len(resp.Header))
	for k, v := range resp.Header {
		if len(v) > 0 {
			flat[k] = v[0]
		}
	}
	return c.JSON(http.StatusOK, sendResponse{
		Status: resp.StatusCode, StatusText: http.StatusText(resp.StatusCode),
		DurationMs: elapsed, SizeBytes: len(raw), Headers: flat, Body: string(raw),
	})

}

func (h *Handler) CreateInCollection(c echo.Context) error {
	cid, err := h.ensureCollectionOwner(c, c.Param("cid"))
	if err != nil {
		return err
	}
	var in saveRequestInput
	if err := c.Bind(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid req body")
	}
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}

	r, err := h.queries.CreateRequest(c.Request().Context(), sqlc.CreateRequestParams{
		CollectionID: cid,
		Name:         in.Name,
		Method:       in.Method,
		Url:          in.URL,
		Params:       defaultJSON(in.Params, "[]"),
		Headers:      defaultJSON(in.Headers, "[]"),
		Body:         defaultJSON(in.Body, "{}"),
	})
	if err != nil {
		h.log.Error("create request failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusCreated, map[string]any{"request": toDTO(r)})
}

func (h *Handler) ListInCollection(c echo.Context) error {
	cid, err := h.ensureCollectionOwner(c, c.Param("cid"))
	if err != nil {
		return err
	}
	list, err := h.queries.ListRequestsByCollection(c.Request().Context(), cid)
	if err != nil {
		h.log.Error("list requests failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	dtos := make([]requestDTO, len(list))
	for i, r := range list {
		dtos[i] = toDTO(r)
	}
	return c.JSON(http.StatusOK, map[string]any{"requests": dtos})
}

func (h *Handler) Get(c echo.Context) error {
	r, err := h.ensureRequestOwner(c, c.Param("id"))
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, map[string]any{"request": toDTO(r)})
}

func (h *Handler) Update(c echo.Context) error {
	existing, err := h.ensureRequestOwner(c, c.Param("id"))
	if err != nil {
		return err
	}
	var in saveRequestInput
	if err := c.Bind(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid req body")
	}
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}

	r, err := h.queries.UpdateRequest(c.Request().Context(), sqlc.UpdateRequestParams{
		ID:      existing.ID,
		Name:    in.Name,
		Method:  in.Method,
		Url:     in.URL,
		Params:  defaultJSON(in.Params, "[]"),
		Headers: defaultJSON(in.Headers, "[]"),
		Body:    defaultJSON(in.Body, "{}"),
	})
	if err != nil {
		h.log.Error("update request failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.JSON(http.StatusOK, map[string]any{"request": toDTO(r)})
}

func (h *Handler) Delete(c echo.Context) error {
	r, err := h.ensureRequestOwner(c, c.Param("id"))
	if err != nil {
		return err
	}
	if err := h.queries.DeleteRequest(c.Request().Context(), r.ID); err != nil {
		h.log.Error("delete request failed", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	return c.NoContent(http.StatusNoContent)
}

// cleanErr strips the URL prefix that *url.Error adds, so the client sees
// "connection to 10.0.0.5 is blocked" / "context deadline exceeded" — no internals leaked.
func cleanErr(err error) string {
	var ue *url.Error
	if errors.As(err, &ue) {
		return ue.Err.Error()
	}
	return err.Error()
}
