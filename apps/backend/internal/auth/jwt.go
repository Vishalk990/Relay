package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

const CookieName = "relay_token"

type Authenticator struct {
	secret         []byte
	cookieLifetime time.Duration
	cookieSecure   bool
}

func NewAuthenticator(secret string, lifetime time.Duration, secure bool) *Authenticator {
	return &Authenticator{
		secret:         []byte(secret),
		cookieLifetime: lifetime,
		cookieSecure:   secure,
	}
}

func (a *Authenticator) CookieSecure() bool { return a.cookieSecure }

func (a *Authenticator) VerifyCookie(c echo.Context) (string, error) {
	cookie, err := c.Cookie(CookieName)
	if err != nil {
		return "", err
	}
	claims, err := a.verifyToken(cookie.Value)
	if err != nil {
		return "", err
	}
	return claims.Subject, nil
}

func (a *Authenticator) Clear(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   a.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (a *Authenticator) IssueAndSet(w http.ResponseWriter, userId string) error {
	token, err := a.issueToken(userId)
	if err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   int(a.cookieLifetime.Seconds()),
		HttpOnly: true,
		Secure:   a.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
	return nil
}

func (a *Authenticator) issueToken(userId string) (string, error) {
	jti, err := newJTI()
	if err != nil {
		return "", err
	}
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   userId,
		ID:        jti,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(a.cookieLifetime)),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString(a.secret)
	if err != nil {
		return "", fmt.Errorf("auth: sign jwt: %w", err)
	}
	return signed, nil
}

func (a *Authenticator) verifyToken(tokenString string) (*jwt.RegisteredClaims, error) {
	claims := &jwt.RegisteredClaims{}
	_, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return a.secret, nil
	})
	if err != nil {
		return nil, err
	}
	return claims, nil
}

func newJTI() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("auth: gen jti: %w", err)
	}
	return hex.EncodeToString(b), nil
}
