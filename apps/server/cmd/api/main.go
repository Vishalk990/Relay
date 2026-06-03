package main

import (
	"context"
	"time"

	"github.com/joho/godotenv"
	"go.uber.org/zap"

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

	log.Info("db connected",
		zap.String("host", cfg.Database.Host),
		zap.String("name", cfg.Database.Name),
	)

}
