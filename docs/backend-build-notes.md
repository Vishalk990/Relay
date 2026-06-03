# Backend Build Notes — what we set up (and what to redo)

> Snapshot of the backend work done before the reset. Reference this while rebuilding from scratch. Captures decisions, file structure, schema designs, and gotchas.

---

## Decisions made (and why)

### Router: Echo v4
Chose Echo over Chi/Gin/Fiber. Keep it — `net/http`-compatible (Echo satisfies `http.Handler`), small surface area, well-documented. Fiber was specifically ruled out: it's built on `fasthttp`, which is incompatible with the custom `http.Transport` required for the proxy SSRF layer (`internal/proxy/`).

### Monorepo (don't split FE/BE)
Considered splitting `apps/web` and `apps/server` into separate repos. **Kept monorepo** because the API contract (`docs/api-spec.yaml`) tightly couples FE+BE — atomic PRs across both are valuable, and codegen pipelines (TS types from OpenAPI) live naturally in one repo. "Different tech stacks" isn't a strong enough reason on its own.

### Module path
`github.com/vishal_kalita/relay/apps/server` — GitHub-style path so no rename when pushing later.

### Config: koanf + validator + godotenv
Matches the pattern used in your `deployment-orchestrator` project. Grouped struct config (`Primary`, `Server`, `Database`) with declarative validation tags. Fails fast at startup on missing/invalid env vars.

### Logger: zap
Structured JSON in prod, human-readable in dev. (Note for future: Go 1.21+ stdlib `log/slog` would be zero-dep — swappable later.)

### DB toolkit: pgx/v5 + pgxpool + sqlc + golang-migrate
- **sqlc** — typed query code generation, no ORM
- **golang-migrate** — schema lifecycle (`.up.sql` / `.down.sql` pairs)
- **pgx native** (not `database/sql`) for Postgres-specific features (JSONB, `pgtype.UUID`, etc.)

### Auth scope: OAuth + email/password (BOTH)
CLAUDE.md v1 scope said email/password only. Decision was to add Google + GitHub OAuth alongside.

### Schema pattern: separate `user_identities` table (Pattern B)
`users` table has **no password column**. Auth methods live in `user_identities`, one row per (user, provider) link. Supports account linking (same user with both Google AND password).

### Sessions: server-side, DB-backed
`sessions` table in Postgres. Cookie carries session UUID only (HttpOnly, Secure in prod, SameSite=Lax). **Not JWT.**

---

## CLIs installed globally (already on your machine — don't reinstall)

| Tool | Install command (for reference) |
|---|---|
| `migrate` | `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest` |
| `sqlc` | `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest` |

Verify with `migrate -version` (returns `dev` when installed via go install — normal) and `sqlc version`.

---

## Go dependencies to add back

```bash
cd apps/server
go get github.com/labstack/echo/v4
go get github.com/jackc/pgx/v5/pgxpool
go get github.com/knadh/koanf/v2
go get github.com/knadh/koanf/providers/env
go get github.com/go-playground/validator/v10
go get github.com/joho/godotenv
go get go.uber.org/zap
# Planned for Phase 4b (auth), never actually installed:
# go get golang.org/x/crypto/bcrypt
go mod tidy   # IMPORTANT: only after writing source files that import these
```

`go mod tidy` removes deps that aren't actually imported. So either write the source first, or skip `tidy` until the files exist.

---

## Folder structure that existed

```
apps/server/
├── cmd/api/main.go              ← stayed as bare stdlib; never got rewritten
├── internal/
│   ├── config/config.go         ← complete: koanf + validator + zap + GetDSN + Print
│   ├── db/
│   │   ├── database.go          ← hand-written: NewPool(ctx, dsn, maxConns, minConns)
│   │   ├── db.go                ← sqlc-generated (DBTX, Queries, WithTx)
│   │   ├── models.go            ← sqlc-generated
│   │   ├── querier.go           ← sqlc-generated (Querier interface)
│   │   ├── users.sql.go         ← sqlc-generated
│   │   ├── sessions.sql.go      ← sqlc-generated
│   │   └── user_identities.sql.go  ← sqlc-generated
│   ├── logger/                  ← specced, never written
│   ├── server/                  ← specced, never written (http.Server wrapper)
│   └── auth/, collections/, environments/, history/, proxy/, requests/   ← empty placeholders
├── migrations/
│   ├── 001_init.up.sql          ← 6 base tables
│   ├── 001_init.down.sql
│   ├── 002_auth_schema.up.sql   ← user_identities + sessions; drops users.hashed_password
│   └── 002_auth_schema.down.sql
├── queries/
│   ├── users.sql
│   ├── user_identities.sql
│   └── sessions.sql
├── sqlc.yaml
├── .env
├── .env.example
├── go.mod
└── go.sum
```

---

## Schema designs

### 001_init.up.sql
- **users** — `id UUID PK gen_random_uuid()`, `email TEXT UNIQUE NOT NULL`, `hashed_password TEXT NOT NULL` (later dropped in 002), `created_at TIMESTAMPTZ DEFAULT NOW()`
- **workspaces** — `id`, `owner_id → users ON DELETE CASCADE`, `name`, `created_at` + idx on `owner_id`
- **collections** (self-referential tree) — `id`, `workspace_id → workspaces CASCADE`, `parent_id → collections CASCADE` (nullable), `name`, `position INT DEFAULT 0`, timestamps + idx on `workspace_id` and `parent_id`
- **requests** — `id`, `collection_id → collections CASCADE`, `name`, `method`, `url`, `headers JSONB DEFAULT '{}'`, `body JSONB`, `auth JSONB`, `position`, timestamps + idx on `collection_id`
- **environments** — `id`, `workspace_id → workspaces CASCADE`, `name`, `variables JSONB`, timestamps + idx on `workspace_id`
- **request_history** — `id`, `user_id → users CASCADE`, `request_snapshot JSONB`, `response JSONB`, `status INT`, `duration_ms INT`, `created_at` + idx on `user_id` and on `created_at DESC`

All UUIDs use `gen_random_uuid()` — built-in on Postgres 13+, **no extension needed**.
All timestamps `TIMESTAMPTZ` with `DEFAULT NOW()`.

### 002_auth_schema.up.sql
- `ALTER TABLE users DROP COLUMN hashed_password;`
- **user_identities** — `id`, `user_id → users CASCADE`, `provider TEXT CHECK IN ('password','google','github')`, `provider_subject TEXT`, `credential TEXT` (NULL for OAuth), `created_at`, `UNIQUE (provider, provider_subject)`, idx on `user_id`
- **sessions** — `id`, `user_id → users CASCADE`, `expires_at TIMESTAMPTZ`, `created_at`, `ip_address INET`, `user_agent TEXT`, idx on `user_id` and on `expires_at`

---

## Key conventions to maintain

### Env var format
Prefix `APP_`. The **first underscore** after `APP_` is the section boundary; everything after stays underscored.

| Env var | Maps to koanf key | Struct field |
|---|---|---|
| `APP_PRIMARY_ENV` | `primary.env` | `Primary.Env` |
| `APP_SERVER_PORT` | `server.port` | `Server.Port` |
| `APP_SERVER_READ_TIMEOUT` | `server.read_timeout` | `Server.ReadTimeout` |
| `APP_SERVER_CORS_ALLOWED_ORIGINS` | `server.cors_allowed_origins` | `Server.CorsAllowedOrigins` |
| `APP_DATABASE_SSL_MODE` | `database.ssl_mode` | `Database.SSLMode` |
| `APP_DATABASE_CONN_MAX_LIFETIME` | `database.conn_max_lifetime` | `Database.ConnMaxLifetime` |

The transform function in `LoadConfig`:

```go
err := k.Load(env.Provider("APP_", ".", func(s string) string {
    s = strings.ToLower(strings.TrimPrefix(s, "APP_"))
    idx := strings.Index(s, "_")
    if idx == -1 { return s }
    return s[:idx] + "." + s[idx+1:]
}), nil)
```

### `.env.example` (full)

```bash
APP_PRIMARY_ENV=local

APP_SERVER_PORT=8080
APP_SERVER_READ_TIMEOUT=10
APP_SERVER_WRITE_TIMEOUT=30
APP_SERVER_IDLE_TIMEOUT=60
APP_SERVER_CORS_ALLOWED_ORIGINS=http://localhost:5173

APP_DATABASE_HOST=localhost
APP_DATABASE_PORT=5432
APP_DATABASE_USER=relay
APP_DATABASE_PASSWORD=relay
APP_DATABASE_NAME=relay
APP_DATABASE_SSL_MODE=disable
APP_DATABASE_MAX_CONNS=10
APP_DATABASE_MIN_CONNS=2
APP_DATABASE_CONN_MAX_LIFETIME=3600
APP_DATABASE_CONN_MAX_IDLE_TIME=600
```

### sqlc.yaml

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "queries"
    schema: "migrations"
    gen:
      go:
        package: "db"
        out: "internal/db"
        sql_package: "pgx/v5"
        emit_json_tags: true
        emit_interface: true
        emit_empty_slices: true
```

### Filename collision in `internal/db/`
sqlc generates `db.go` itself (containing `DBTX` interface + `Queries` struct + `WithTx`). So the **hand-written pool file was named `database.go`** to avoid the collision. Don't name your pool file `db.go`.

### Migration filename format
3-digit seq prefix: `001_init.up.sql`, `001_init.down.sql`. Scaffold new ones via:
```
make migrate-new name=add_xxx
# runs: migrate create -ext sql -dir migrations -seq -digits 3 add_xxx
```

### Echo middleware order
`Logger` BEFORE `Recover`. Echo runs middleware in order on the way in and reverse on the way out — this lets `Logger` see panics that `Recover` caught.

### `http.Server` with explicit timeouts (don't use `e.Start(":8080")`)
Wrap Echo in a `*http.Server` with `ReadTimeout`, `WriteTimeout`, `IdleTimeout` from config. Without timeouts, you're vulnerable to slowloris. The wrapper also enables graceful shutdown via `srv.Shutdown(ctx)` on SIGINT/SIGTERM.

```go
srv := &http.Server{
    Addr:         ":" + cfg.Server.Port,
    Handler:      e,                  // Echo plugs in here
    ReadTimeout:  time.Duration(cfg.Server.ReadTimeout)  * time.Second,
    WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
    IdleTimeout:  time.Duration(cfg.Server.IdleTimeout)  * time.Second,
}
```

### Migration rule (from CLAUDE.md)
**Never edit a migration after merge.** Wrong schema? Write a new migration on top. Same for sqlc-generated code — never hand-edit; regenerate via `make sqlc-gen`.

---

## Makefile targets that existed

```makefile
.PHONY: dev-web dev-server build-server migrate-up migrate-down migrate-status migrate-new sqlc-gen help

LOCAL_DB_URL ?= postgres://relay:relay@localhost:5432/relay?sslmode=disable

dev-web:        cd apps/web && npm run dev
dev-server:     cd apps/server && go run ./cmd/api
build-server:   cd apps/server && go build -o ../../bin/api ./cmd/api

migrate-up:     cd apps/server && migrate -path migrations -database "$(LOCAL_DB_URL)" up
migrate-down:   cd apps/server && migrate -path migrations -database "$(LOCAL_DB_URL)" down 1
migrate-status: cd apps/server && migrate -path migrations -database "$(LOCAL_DB_URL)" version

migrate-new:
	@if [ -z "$(name)" ]; then echo "usage: make migrate-new name=add_xxx"; exit 1; fi
	cd apps/server && migrate create -ext sql -dir migrations -seq -digits 3 $(name)

sqlc-gen:       cd apps/server && sqlc generate
```

---

## What was deferred / never built (your TODO when rebuilding)

- **`main.go` rewrite** — never moved off bare stdlib; should load config, build server wrapper, mount Echo, graceful shutdown
- **`internal/logger/logger.go`** — zap wrapper: `InitializeBasic()`, `ReinitializeWithConfig(env)`, `Sync()`
- **`internal/server/server.go`** — `*Server` holding `httpServer`, `pool`, `log`; methods: `New(cfg, log)`, `SetupHTTPServer(handler)`, `Start()`, `Shutdown(ctx)`, `Pool()`
- **Phase 4b: email/password auth** — bcrypt helpers, session create/lookup/delete, auth middleware, `/auth/signup`, `/auth/login`, `/auth/logout`, `/auth/me`
- **Phase 4c: OAuth** — Google + GitHub flows (`/auth/google`, `/auth/google/callback`, same for github), state-token CSRF protection, identity lookup-or-create, email-based account linking
- **CLAUDE.md update** — Echo (not Chi), OAuth scope addition, dep list (koanf/validator/zap), filename conventions for sqlc collision

---

## OAuth setup status
You may have registered OAuth apps already. If yes:
- **Google** callback: `http://localhost:8080/auth/google/callback`
- **GitHub** callback: `http://localhost:8080/auth/github/callback`

Save the `client_id` + `client_secret` for each in your new `.env` when you get to Phase 4c.

---

## Database state after the reset

**Postgres still has all 8 app tables + `schema_migrations` (versions 001 + 002).** When rebuilding:

- **Want a fresh DB?** `docker compose down -v && docker compose up -d db`
- **Want to keep the schema?** Just rebuild the Go side. If you write equivalent migrations and run `make migrate-up`, it'll see version 2 is already applied and do nothing — perfectly fine.

The `docker-compose.yaml` is unchanged from before — keep using it.

---

## Quick rebuild path (rough order)

1. `cd apps/server && go mod init github.com/vishal_kalita/relay/apps/server`
2. `mkdir -p cmd/api internal/{auth,collections,config,db,environments,history,logger,proxy,requests,server} migrations queries`
3. Install Go deps (see list above)
4. Write `sqlc.yaml`, `.env`, `.env.example`
5. Write `migrations/001_init.up.sql` + `.down.sql`
6. Write `migrations/002_auth_schema.up.sql` + `.down.sql`
7. Restore Makefile targets (`migrate-*`, `sqlc-gen`, `dev-server`, `build-server`)
8. Decide DB state: wipe (`docker compose down -v`) or keep existing schema, then `make migrate-up` as needed
9. Write `internal/config/config.go`
10. Write `internal/db/database.go` (the pool — **NOT** named `db.go`)
11. Write `queries/users.sql`, `user_identities.sql`, `sessions.sql`
12. `make sqlc-gen`
13. Write `internal/logger/logger.go`
14. Write `internal/server/server.go` (the `*http.Server` wrapper)
15. Write `cmd/api/main.go` (godotenv → config → server.New → Echo → SetupHTTPServer(e) → Start goroutine → wait SIGINT → Shutdown)
16. `go mod tidy && go run ./cmd/api` → `curl localhost:8080/healthz` should return `{"db":"ok","status":"ok"}`
17. Phase 4b (auth handlers), Phase 4c (OAuth)

Second pass will be significantly faster than the first — you already have the design.
