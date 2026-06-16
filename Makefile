.PHONY: help dev-web dev-server dev migrate-new migrate-up migrate-down sqlc-gen \
observability observability-down observability-logs

LOCAL_DB_URL ?= postgres://relay:relay@localhost:5432/relay?sslmode=disable
OBS_COMPOSE ?= docker compose -f infra/docker-compose.observability.yml

help:
	@echo "Available targets:"
	@echo ""
	@echo " Dev:"
	@echo "  make dev-web		# NextJS dev server (apps/web)"
	@echo "  make dev-server	# Go API server (apps/server)"
	@echo "  make dev		# web + server + observability"
	@echo ""
	@echo " Observability:"
	@echo "  make observability		# start Prometheus + Grafana (detached)"
	@echo "  make observability-down	# stop them"
	@echo "  make observability-logs	# tail their logs"


observability:
	$(OBS_COMPOSE) up -d

observability-down:
	$(OBS_COMPOSE) down	

observability-logs:
	$(OBS_COMPOSE) logs -f

dev: observability
	@trap 'kill 0' SIGINT; \
	(cd apps/backend && go run ./cmd/api) & \
	(cd apps/web && npm run dev) & \
	wait

dev-web: observability
	cd apps/web && npm run dev

dev-server:
	cd apps/backend && go run ./cmd/api

migrate-new:
	@if [ -z "$(name)" ]; then echo "usage: make migrate-new name=create_xxx"; exit 1; fi
	cd apps/backend && migrate create -ext sql -dir migrations -seq -digits 3 $(name)

sqlc-gen:
	cd apps/backend && sqlc generate
