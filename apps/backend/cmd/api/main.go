package main

import (
	"context"
	"os"
	"os/signal"
	"relay-backend/internal/config"
	"relay-backend/internal/db"
	"relay-backend/internal/logger"
	"relay-backend/internal/metrics"
	"relay-backend/internal/server"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	log := logger.InitializeBasic()

	if err := godotenv.Load(); err != nil {
		log.Warn("no .env loaded (fine in production)", zap.Error(err))
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatal("load config failed")
	}
	log = logger.ReInitializeWithConfig(cfg.Primary.Env)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := db.NewPool(ctx, cfg.Database.GetDSN(), cfg.Database.MaxConns, cfg.Database.MinConns)
	if err != nil {
		log.Fatal("db pool failed", zap.Error(err))
	}
	defer pool.Close()

	log.Info("db connected", zap.String("name", cfg.Database.Name))
	metrics.RecordDBPoolStats(pool)

	srv := server.New(cfg, log, pool)
	go func() {
		if err := srv.Start(); err != nil {
			log.Fatal("server failed", zap.Error(err))
		}
	}()

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
