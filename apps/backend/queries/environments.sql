-- name: CreateEnvironment :one
INSERT INTO environments (workspace_id, name, variables)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListEnvironmentsByWorkspace :many
SELECT * FROM environments WHERE workspace_id = $1 ORDER BY created_at;

-- name: GetEnvironmentForUser :one
SELECT e.* FROM environments e
JOIN workspaces w ON w.id = e.workspace_id
WHERE e.id = $1 AND w.owner_id = $2;

-- name: UpdateEnvironment :one
UPDATE environments SET name = $2, variables = $3, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteEnvironment :exec
DELETE FROM environments WHERE id = $1;
