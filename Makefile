.PHONY: help dev-web migrate-new migrate-up migrate-down sqlc-gen dev

LOCAL_DB_URL ?= postgres://relay:relay@localhost:5432/relay?sslmode=disable

help:
	@echo "Available targets:"
	@echo ""
	@echo " Dev:"
	@echo "  make dev-web		# NextJS dev server (apps/web)"
	@echo "  make dev-server	# Go API server (apps/server)"

dev:
	@trap 'kill 0' SIGINT; \
	(cd apps/backend && go run ./cmd/api) & \
	(cd apps/web && npm run dev) & \
	wait

dev-web:
	cd apps/web && npm run dev

dev-server:
	cd apps/backend && go run ./cmd/api

migrate-new:
	@if [ -z "$(name)" ]; then echo "usage: make migrate-new name=create_xxx"; exit 1; fi
	cd apps/backend && migrate create -ext sql -dir migrations -seq -digits 3 $(name)

sqlc-gen:
	cd apps/backend && sqlc generate
