package server

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"relay-backend/internal/auth"
	"relay-backend/internal/collections"
	"relay-backend/internal/config"
	"relay-backend/internal/environments"
	"relay-backend/internal/requests"
	"relay-backend/internal/workspaces"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo-contrib/echoprometheus"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.uber.org/zap"
)

type Server struct {
	cfg        *config.Config
	log        *zap.Logger
	pool       *pgxpool.Pool
	auth       *auth.Authenticator
	echo       *echo.Echo
	httpServer *http.Server
}

func New(cfg *config.Config, log *zap.Logger, pool *pgxpool.Pool) *Server {

	cookieSecure := cfg.Primary.Env != "local" && cfg.Primary.Env != "development"
	authenticator := auth.NewAuthenticator(
		cfg.Auth.JWTSecret,
		time.Duration(cfg.Auth.JWTLifetime)*time.Second,
		cookieSecure,
	)
	s := &Server{
		cfg:  cfg,
		log:  log,
		pool: pool,
		auth: authenticator,
		echo: echo.New(),
	}

	s.echo.HideBanner = true
	s.echo.HidePort = true

	s.setupMiddleware()
	s.setupRoutes()
	s.setupHTTPServer()
	return s
}

func (s *Server) setupMiddleware() {

	s.echo.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogStatus:   true,
		LogMethod:   true,
		LogURI:      true,
		LogError:    true,
		HandleError: true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			s.log.Info("request",
				zap.String("method", v.Method),
				zap.String("uri", v.URI),
				zap.Int("status", v.Status),
			)
			return nil
		},
	}))
	s.echo.Use(middleware.Recover())
	s.echo.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     s.cfg.Server.CorsAllowedOrigin,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowCredentials: true,
	}))
	s.echo.Use(echoprometheus.NewMiddleware("relay"))

}

func (s *Server) setupRoutes() {
	s.echo.GET("/health", s.healthHandler)

	s.echo.GET("/metrics", echoprometheus.NewHandler())

	googleOAuth := auth.NewGoogleOAuthConfig(
		s.cfg.OAuth.GoogleClientID,
		s.cfg.OAuth.GoogleClientSecret,
		s.cfg.OAuth.GoogleCallbackURL,
	)

	authHandler := auth.NewHandler(s.pool, s.log, s.auth, googleOAuth, s.cfg.OAuth.FrontendURL)

	s.echo.POST("/auth/sign-up", authHandler.SignUp)
	s.echo.POST("/auth/login", authHandler.Login)
	s.echo.POST("/auth/logout", authHandler.Logout)
	s.echo.GET("/auth/me", authHandler.Me, auth.Middleware(s.auth))
	s.echo.GET("/auth/google/login", authHandler.GoogleLogin)
	s.echo.GET("/auth/google/callback", authHandler.GoogleCallback)

	// protected routes
	protected := s.echo.Group("/api")
	protected.Use(auth.Middleware(s.auth))

	workspaceHandler := workspaces.NewHandler(s.pool, s.log)
	protected.GET("/workspaces", workspaceHandler.List)
	protected.POST("/workspaces", workspaceHandler.Create)
	protected.GET("/workspaces/:id", workspaceHandler.Get)
	protected.DELETE("/workspaces/:id", workspaceHandler.Delete)

	reqHandler := requests.NewHandler(s.pool, s.log)
	protected.POST("/requests/send", reqHandler.Send)
	protected.POST("/collections/:cid/requests", reqHandler.CreateInCollection)
	protected.GET("/collections/:cid/requests", reqHandler.ListInCollection)
	protected.GET("/requests/:id", reqHandler.Get)
	protected.PATCH("/requests/:id", reqHandler.Update)
	protected.DELETE("/requests/:id", reqHandler.Delete)

	collectionHandler := collections.NewHandler(s.pool, s.log)
	protected.POST("/collections", collectionHandler.Create)
	protected.GET("/collections", collectionHandler.List)

	envHandler := environments.NewHandler(s.pool, s.log)
	protected.POST("/workspaces/:wid/environments", envHandler.CreateInWorkspace)
	protected.GET("/workspaces/:wid/environments", envHandler.ListInWorkspace)
	protected.GET("/environments/:id", envHandler.Get)
	protected.PATCH("/environments/:id", envHandler.Update)
	protected.DELETE("/environments/:id", envHandler.Delete)
}

func (s *Server) setupHTTPServer() {
	s.httpServer = &http.Server{
		Addr:         ":" + s.cfg.Server.Port,
		Handler:      s.echo,
		ReadTimeout:  time.Duration(s.cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(s.cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(s.cfg.Server.IdleTimeout) * time.Second,
	}
}

func (s *Server) healthHandler(c echo.Context) error {
	if err := s.pool.Ping(c.Request().Context()); err != nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{
			"status": "degraded",
			"db":     "down",
		})
	}
	return c.JSON(http.StatusOK, map[string]string{
		"status": "ok",
		"db":     "ok",
	})
}

func (s *Server) Start() error {
	s.log.Info("http server listening", zap.String("addr", s.httpServer.Addr))
	if err := s.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("server: listen: %w", err)
	}
	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.log.Info("server: shutting down")
	if err := s.httpServer.Shutdown(ctx); err != nil {
		return fmt.Errorf("server: shutdown: %w", err)
	}
	return nil
}
