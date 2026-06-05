package auth

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

const ContextUserID = "user_id"

func Middleware(a *Authenticator) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userID, err := a.VerifyCookie(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "not authenticated")
			}
			c.Set(ContextUserID, userID)
			return next(c)
		}
	}
}

// UserIDFromContext returns the user ID set by Middleware. Empty string if
// the route wasn't protected (handler bug).
func UserIDFromContext(c echo.Context) string {
	v, _ := c.Get(ContextUserID).(string)
	return v
}

func MustUserID(c echo.Context) (pgtype.UUID, error) {
	s, ok := c.Get(ContextUserID).(string)
	if !ok || s == "" {
		return pgtype.UUID{}, echo.NewHTTPError(http.StatusUnauthorized, "not authenticated")
	}
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		return pgtype.UUID{}, echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}
	return u, nil
}
