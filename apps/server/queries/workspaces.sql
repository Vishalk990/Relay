-- name: CreateWorkspace :one
INSERT INTO workspaces (owner_id, name)
VALUES ($1, $2)
RETURNING *;

-- name: GetWorkspaceByID :one
SELECT * FROM workspaces
WHERE id = $1 AND owner_id = $2
LIMIT 1;

-- name: ListWorkspacesForUser :many
SELECT * FROM workspaces
WHERE owner_id = $1
ORDER BY created_at;

-- name: UpdateWorkspaceName :one
UPDATE workspaces
SET name = $2
WHERE id = $1 AND owner_id = $3
RETURNING *;

-- name: DeleteWorkspace :exec
DELETE FROM workspaces
WHERE id = $1 AND owner_id = $2;
