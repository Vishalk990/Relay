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
	Server   Server
	Database Database
	Auth     Auth
	OAuth    OAuth
}

type Primary struct {
	Env string `validate:"required,oneof=development staging production local"`
}

type Server struct {
	Port              string   `validate:"required"`
	ReadTimeout       int      `validate:"required,min=1"`
	WriteTimeout      int      `validate:"required,min=1"`
	IdleTimeout       int      `validate:"required,min=1"`
	CorsAllowedOrigin []string `validate:"required"`
}

type Database struct {
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

type Auth struct {
	JWTSecret   string `validate:"required"`
	JWTLifetime int    `validate:"required,min=60"`
}

type OAuth struct {
	GoogleClientID     string `validate:"required"`
	GoogleClientSecret string `validate:"required"`
	GoogleCallbackURL  string `validate:"required,url"`
	FrontendURL        string `validate:"required,url"`
}

func Load() (*Config, error) {
	cfg := &Config{
		Primary: Primary{
			Env: os.Getenv("PRIMARY_ENV"),
		},
		Server: Server{
			Port:              os.Getenv("SERVER_PORT"),
			ReadTimeout:       atoi("SERVER_READ_TIMEOUT"),
			WriteTimeout:      atoi("SERVER_WRITE_TIMEOUT"),
			IdleTimeout:       atoi("SERVER_IDLE_TIMEOUT"),
			CorsAllowedOrigin: splitCsv("SERVER_CORS_ALLOWED_ORIGINS"),
		},
		Database: Database{
			Host:            os.Getenv("DATABASE_HOST"),
			Port:            atoi("DATABASE_PORT"),
			User:            os.Getenv("DATABASE_USER"),
			Password:        os.Getenv("DATABASE_PASSWORD"),
			Name:            os.Getenv("DATABASE_NAME"),
			SSLMode:         os.Getenv("DATABASE_SSL_MODE"),
			MaxConns:        atoi32("DATABASE_MAX_CONNS"),
			MinConns:        atoi32("DATABASE_MIN_CONNS"),
			ConnMaxLifetime: atoi("DATABASE_CONN_MAX_LIFETIME"),
			ConnMaxIdletime: atoi("DATABASE_CONN_MAX_IDLE_TIME"),
		},
		Auth: Auth{
			JWTSecret:   os.Getenv("AUTH_JWT_SECRET"),
			JWTLifetime: atoi("AUTH_JWT_LIFETIME"),
		},
		OAuth: OAuth{
			GoogleClientID:     os.Getenv("OAUTH_GOOGLE_CLIENT_ID"),
			GoogleClientSecret: os.Getenv("OAUTH_GOOGLE_CLIENT_SECRET"),
			GoogleCallbackURL:  os.Getenv("OAUTH_GOOGLE_CALLBACK_URL"),
			FrontendURL:        os.Getenv("OAUTH_FRONTEND_URL"),
		},
	}

	if err := validator.New().Struct(cfg); err != nil {
		return nil, fmt.Errorf("config: validation: %w", err)
	}
	return cfg, nil
}

func atoi(arg string) int {
	i, err := strconv.Atoi(os.Getenv(arg))
	if err != nil {
		panic(err)
	}
	return i
}

func atoi32(arg string) int32 {
	n, err := strconv.ParseInt(os.Getenv(arg), 10, 32)
	if err != nil {
		panic(err)
	}
	return int32(n)
}

func splitCsv(arg string) []string {
	if arg == "" {
		return nil
	}

	parts := strings.Split(arg, ",")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	return parts
}

func (c *Database) GetDSN() string {
	if c.Password == "" {
		return fmt.Sprintf("host=%s port=%d user=%s dbname=%s sslmode=%s", c.Host, c.Port, c.User, c.Name, c.SSLMode)
	}

	escaped := strings.ReplaceAll(c.Password, `\`, `\\`)
	escaped = strings.ReplaceAll(escaped, `'`, `\'`)
	return fmt.Sprintf("host=%s port=%d user=%s password='%s' dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, escaped, c.Name, c.SSLMode)
}
