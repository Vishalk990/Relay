package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/go-playground/validator/v10"
)

type Config struct {
	Primary  Primary
	Server   ServerConfig
	Database DatabaseConfig
}

type Primary struct {
	Env string `validate:"required,oneof=development staging production local"`
}

type ServerConfig struct {
	Port              string   `validate:"required"`
	ReadTimeout       int      `validate:"required,min=1"`
	WriteTimeout      int      `validate:"required,min=1"`
	IdleTimeout       int      `validate:"required,min=1"`
	CorsAllowedOrigin []string `validate:"required"`
}

type DatabaseConfig struct {
	Host            string `validate:"required"`
	Port            int    `validate:"required,min=1,max=65535"`
	User            string `validate:"required"`
	Password        string
	Name            string `validate:"required"`
	SSLMode         string `validate:"required,oneof=disable require verify-ca verify-full"`
	MaxConns        int32  `validate:"required,min=1"`
	MinConns        int32  `validate:"required,min=0"`
	ConnMaxLifetime int    `validate:"required,min=0"`
	ConnMaxIdletime int    `validate:"required"`
}

func Load() (*Config, error) {
	cfg := &Config{
		Primary: Primary{
			Env: os.Getenv("APP_PRIMARY_ENV"),
		},
		Server: ServerConfig{
			Port:              os.Getenv("APP_SERVER_PORT"),
			ReadTimeout:       atoi("APP_SERVER_READ_TIMEOUT"),
			WriteTimeout:      atoi("APP_SERVER_WRITE_TIMEOUT"),
			IdleTimeout:       atoi("APP_SERVER_IDLE_TIMEOUT"),
			CorsAllowedOrigin: splitCSV(os.Getenv("APP_SERVER_CORS_ALLOWED_ORIGINS")),
		},
		Database: DatabaseConfig{
			Host:            os.Getenv("APP_DATABASE_HOST"),
			Port:            atoi("APP_DATABASE_PORT"),
			User:            os.Getenv("APP_DATABASE_USER"),
			Password:        os.Getenv("APP_DATABASE_PASSWORD"),
			Name:            os.Getenv("APP_DATABASE_NAME"),
			SSLMode:         os.Getenv("APP_DATABASE_SSL_MODE"),
			MaxConns:        atoi32("APP_DATABASE_MAX_CONNS"),
			MinConns:        atoi32("APP_DATABASE_MIN_CONNS"),
			ConnMaxLifetime: atoi("APP_DATABASE_CONN_MAX_LIFETIME"),
			ConnMaxIdletime: atoi("APP_DATABASE_CONN_MAX_IDLE_TIME"),
		},
	}
	if err := validator.New().Struct(cfg); err != nil {
		return nil, fmt.Errorf("config: validation: %w", err)
	}
	return cfg, nil
}

func atoi(key string) int {
	n, _ := strconv.Atoi(os.Getenv(key))
	return n
}

func atoi32(key string) int32 {
	n, _ := strconv.ParseInt(os.Getenv(key), 10, 32)
	return int32(n)
}

func splitCSV(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	return parts
}

func (c *DatabaseConfig) GetDSN() string {
	if c.Password == "" {
		return fmt.Sprintf("host=%s port=%d user=%s dbname=%s sslmode=%s",
			c.Host, c.Port, c.User, c.Name, c.SSLMode)
	}
	// Escape backslash + single-quote so passwords with special chars work.
	escaped := strings.ReplaceAll(c.Password, `\`, `\\`)
	escaped = strings.ReplaceAll(escaped, `'`, `\'`)
	return fmt.Sprintf("host=%s port=%d user=%s password='%s' dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, escaped, c.Name, c.SSLMode)
}
