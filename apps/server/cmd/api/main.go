package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.uber.org/zap"

	"relay-backend/internal/auth"
	"relay-backend/internal/config"
	"relay-backend/internal/db"
	"relay-backend/internal/logger"
)

func main() {
	log, _ := zap.NewDevelopment()
	defer log.Sync()

	if err := godotenv.Load(); err != nil {
		log.Warn("no .env loaded (fine in production)", zap.Error(err))
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatal("load config failed", zap.Error(err))
	}

	log = logger.ReinitializeWithConfig(cfg.Primary.Env)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := db.NewPool(ctx, cfg.Database.GetDSN(), cfg.Database.MaxConns, cfg.Database.MinConns)
	if err != nil {
		log.Fatal("db pool failed", zap.Error(err))
	}
	defer pool.Close()

	log.Info("db connected", zap.String("name", cfg.Database.Name))

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     cfg.Server.CorsAllowedOrigin,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodDelete, http.MethodPut, http.MethodOptions},
		AllowCredentials: true,
	}))

	e.GET("/health", func(c echo.Context) error {
		if err := pool.Ping(c.Request().Context()); err != nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{
				"status": "degraded",
				"db":     "down",
			})
		}
		return c.JSON(http.StatusOK, map[string]string{
			"status": "ok",
			"db":     "ok",
		})
	})

	authHandler := auth.NewHandler(pool, log)
	e.POST("/auth/signup", authHandler.Signup)

	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      e,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
	}
	go func() {
		log.Info("http server listening", zap.String("addr", srv.Addr))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal("server failed", zap.Error(err))
		}
	}()

	// --- Graceful shutdown ---
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	log.Info("shutdown signal received")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatal("graceful shutdown failed", zap.Error(err))
	}
	log.Info("server stopped cleanly")
}
