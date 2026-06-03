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
	"golang.org/x/oauth2/github"
)

const (
	OAuthStateCookie   = "relay_oauth_state"
	OAuthStateLifetime = 5 * time.Minute
)

func NewGitHubOAuthConfig(clientID, clientSecret, callbackURL string) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     github.Endpoint,
		RedirectURL:  callbackURL,
		// read:user → access profile; user:email → access primary email even when private.
		Scopes: []string{"read:user", "user:email"},
	}
}

// GenerateOAuthState returns a 64-char hex string of 32 random bytes.
// Used as the OAuth `state` query param to defend against CSRF on the callback.
func GenerateOAuthState() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("oauth: gen state: %w", err)
	}
	return hex.EncodeToString(b), nil
}

// SetOAuthStateCookie writes the state token as a short-lived HttpOnly cookie.
// The callback verifies the query param against this cookie before trusting it.
func SetOAuthStateCookie(w http.ResponseWriter, state string, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     OAuthStateCookie,
		Value:    state,
		Path:     "/",
		MaxAge:   int(OAuthStateLifetime.Seconds()),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// ClearOAuthStateCookie expires the state cookie after the callback finishes.
func ClearOAuthStateCookie(w http.ResponseWriter, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     OAuthStateCookie,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// VerifyOAuthState compares the `state` URL query param against the value
// stored in the state cookie. Returns an error if missing or mismatched.
func VerifyOAuthState(c echo.Context) error {
	cookie, err := c.Cookie(OAuthStateCookie)
	if err != nil {
		return fmt.Errorf("oauth: state cookie missing")
	}
	queryState := c.QueryParam("state")
	if cookie.Value == "" || cookie.Value != queryState {
		return fmt.Errorf("oauth: state mismatch")
	}
	return nil
}

// GitHubUser holds the fields we care about from GitHub's user API.
type GitHubUser struct {
	ID    int64  `json:"id"`
	Login string `json:"login"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// FetchGitHubUser exchanges the OAuth code for an access token, then fetches
// the authenticated user's profile from the GitHub API. Handles GitHub's
// quirk that .Email is "" for users with private emails — falls back to
// /user/emails and picks the primary verified one.
func FetchGitHubUser(ctx context.Context, cfg *oauth2.Config, code string) (*GitHubUser, error) {
	token, err := cfg.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("oauth: exchange code: %w", err)
	}
	client := cfg.Client(ctx, token)

	// 1. Fetch user profile
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return nil, fmt.Errorf("oauth: fetch user: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("oauth: fetch user: status %d: %s", resp.StatusCode, string(body))
	}

	var user GitHubUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("oauth: decode user: %w", err)
	}

	if user.Email != "" {
		return &user, nil
	}

	// 2. Email was private — fall back to /user/emails
	resp2, err := client.Get("https://api.github.com/user/emails")
	if err != nil {
		return nil, fmt.Errorf("oauth: fetch emails: %w", err)
	}
	defer resp2.Body.Close()
	if resp2.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("oauth: fetch emails: status %d", resp2.StatusCode)
	}

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	if err := json.NewDecoder(resp2.Body).Decode(&emails); err != nil {
		return nil, fmt.Errorf("oauth: decode emails: %w", err)
	}

	for _, e := range emails {
		if e.Primary && e.Verified {
			user.Email = e.Email
			break
		}
	}
	if user.Email == "" {
		return nil, fmt.Errorf("oauth: no verified primary email available")
	}

	return &user, nil
}
