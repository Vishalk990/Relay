-- name: CreateCollection :one
INSERT INTO collections (workspace_id, parent_id, name) VALUES ($1,$2,$3) 
RETURNING *;

-- name: ListCollectionsByWorkspace :many
SELECT * FROM collections WHERE workspace_id = $1 ORDER BY position, created_at;