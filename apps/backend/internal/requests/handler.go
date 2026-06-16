package requests

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/url"
	"relay-backend/internal/auth"
	"relay-backend/internal/proxy"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type Handler struct {
	log    *zap.Logger
	client *http.Client
}

func NewHandler(log *zap.Logger) *Handler {
	return &Handler{log: log, client: proxy.NewSafeClient()}
}

type header struct {
	Key     string `json:"key"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

type sendRequest struct {
	Method  string   `json:"method"`
	URL     string   `json:"url"`
	Headers []header `json:"headers"`
	Body    string   `json:"body"`
}
type sendResponse struct {
	Status     int               `json:"status"`
	StatusText string            `json:"statusText"`
	DurationMs int64             `json:"durationMs"`
	SizeBytes  int               `json:"sizeBytes"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
}

var allowedMethods = map[string]bool{
	http.MethodGet: true, http.MethodPost: true, http.MethodPut: true, http.MethodPatch: true,
	http.MethodDelete: true, http.MethodHead: true, http.MethodOptions: true,
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

// cleanErr strips the URL prefix that *url.Error adds, so the client sees
// "connection to 10.0.0.5 is blocked" / "context deadline exceeded" — no internals leaked.
func cleanErr(err error) string {
	var ue *url.Error
	if errors.As(err, &ue) {
		return ue.Err.Error()
	}
	return err.Error()
}
