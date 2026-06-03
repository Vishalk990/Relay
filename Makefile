.PHONY: dev-web dev-server build-server migrate-up migrate-down migrate-status migrate-new sqlc-gen help

LOCAL_DB_URL ?= postgres://relay:relay@localhost:5432/relay?sslmode=disable


help:
	@echo "Available targets:"
	@echo ""
	@echo "  Dev:"
	@echo "    make dev-web        # Vite dev server (apps/web)"
	@echo "    make dev-server     # Go API server (apps/server)"
	@echo "    make build-server   # Compile Go binary"
	@echo ""
	@echo "  Database:"
	@echo "    make migrate-up     # Apply all pending migrations"
	@echo "    make migrate-down   # Roll back the most recent migration"
	@echo "    make migrate-status # Show current migration version"
	@echo "    make migrate-new name=create_xxx  # Scaffold a new up/down pair"
	@echo "    make sqlc-gen       # Regenerate Go code from queries/*.sql"


dev-web:
	cd apps/web && npm run dev

dev-server:
	cd apps/server && go run ./cmd/api

build-server:
	cd apps/server && go build -o ../../bin/api ./cmd/api

migrate-up:
	cd apps/server && migrate -path migrations -database "$(LOCAL_DB_URL)" up

migrate-down:
	cd apps/server && migrate -path migrations -database "$(LOCAL_DB_URL)" down 1

migrate-status:
	cd apps/server && migrate -path migrations -database "$(LOCAL_DB_URL)" version

migrate-new:
	@if [ -z "$(name)" ]; then echo "usage: make migrate-new name=create_xxx"; exit 1; fi
	cd apps/server && migrate create -ext sql -dir migrations -seq -digits 3 $(name)

sqlc-gen:
	cd apps/server && sqlc generate
