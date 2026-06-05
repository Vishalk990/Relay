-- name: CreateCollection :one
INSERT INTO collections (workspace_id, parent_id, name, position)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListCollectionsInWorkspace :many
SELECT * FROM collections
WHERE workspace_id = $1
ORDER BY parent_id NULLS FIRST, position, created_at;

-- name: GetCollectionByID :one
SELECT * FROM collections
WHERE id = $1
LIMIT 1;

-- name: UpdateCollectionName :one
UPDATE collections SET name = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteCollection :exec
DELETE FROM collections WHERE id = $1;
