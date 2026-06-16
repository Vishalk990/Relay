package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

const (
	OAuthStateCookie   = "relay_oauth_state"
	OAuthStateLifetime = 5 * time.Minute
)

type GoogleUser struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	EmailVerified bool   `json:"email_verified"`
}

func NewGoogleOAuthConfig(clienID, clientSecret, callbackURL string) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     clienID,
		ClientSecret: clientSecret,
		Endpoint:     google.Endpoint,
		RedirectURL:  callbackURL,
		Scopes:       []string{"openid", "email", "profile"},
	}
}

func GenerateOAuthState() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("oauth: gen state: %w", err)
	}
	return hex.EncodeToString(b), nil
}

func SetOAuthStateCookie(w http.ResponseWriter, state string, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name: OAuthStateCookie, Value: state, Path: "/",
		MaxAge:   int(OAuthStateLifetime.Seconds()),
		HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode,
	})
}

func ClearOAuthStateCookie(w http.ResponseWriter, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name: OAuthStateCookie, Value: "", Path: "/",
		MaxAge:   -1,
		HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode,
	})
}

func VerifyOAuthState(c echo.Context) error {
	cookie, err := c.Cookie(OAuthStateCookie)
	if err != nil {
		return fmt.Errorf("oauth: state cookie missing")
	}
	if cookie.Value == "" || cookie.Value != c.QueryParam("state") {
		return fmt.Errorf("oauth: state mismatch")
	}
	return nil

}

func FetchGoogleUser(ctx context.Context, cfg *oauth2.Config, code string) (*GoogleUser, error) {
	token, err := cfg.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("oauth: exchange code: %w", err)
	}
	client := cfg.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		return nil, fmt.Errorf("oauth: fetch userinfo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("oauth: userinfo status %d: %s", resp.StatusCode, body)

	}
	var u GoogleUser
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return nil, fmt.Errorf("oauth: decode userinfo: %w", err)
	}
	return &u, nil
}
