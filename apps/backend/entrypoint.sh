#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] applying migrations..."
  migrate -path /app/migrations -database "$DATABASE_URL" up
else
  echo "[entrypoint] DATABASE_URL not set, skipping migrations"
fi

exec /app/api
