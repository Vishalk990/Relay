package server

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"relay-backend/internal/auth"
	"relay-backend/internal/config"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
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
	// TEMPORARY: HideBanner = false + Start() using e.Start() so the banner shows.
	// Revert after seeing it once (lose timeouts otherwise).
	s.echo.HideBanner = false
	s.echo.HidePort = false

	s.setupMiddleware()
	s.setupRoutes()
	s.setupHTTPServer()

	return s
}

func (s *Server) setupMiddleware() {
	s.echo.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogStatus:   true,
		LogURI:      true,
		LogMethod:   true,
		LogLatency:  true,
		LogError:    true,
		HandleError: true, // recommended for letting handler chain see errors
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			if v.Error == nil {
				s.log.Info("request",
					zap.String("method", v.Method),
					zap.String("uri", v.URI),
					zap.Int("status", v.Status),
					zap.Duration("latency", v.Latency),
				)
			} else {
				s.log.Error("request",
					zap.String("method", v.Method),
					zap.String("uri", v.URI),
					zap.Int("status", v.Status),
					zap.Duration("latency", v.Latency),
					zap.Error(v.Error),
				)
			}
			return nil
		},
	}))

	s.echo.Use(middleware.Recover())
	s.echo.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     s.cfg.Server.CorsAllowedOrigin,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowCredentials: true,
	}))
}

func (s *Server) setupRoutes() {
	s.echo.GET("/health", s.healthHandler)

	authHandler := auth.NewHandler(s.pool, s.log, s.auth)
	s.echo.POST("/auth/sign-up", authHandler.Signup)
	s.echo.POST("/auth/login", authHandler.Login)
	s.echo.POST("/auth/logout", authHandler.Logout)

	protected := s.echo.Group("")
	protected.Use(auth.Middleware(s.auth))
	protected.GET("/auth/me", authHandler.Me)
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
