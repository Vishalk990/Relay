-- name: CreateRequest :one
INSERT INTO requests (collection_id, name, method, url, params, headers, body)
VALUES ($1, $2, $3, $4, $5, $6, $7) 
RETURNING *;

-- name: ListRequestsByCollection :many
SELECT * FROM requests WHERE collection_id = $1 ORDER BY position, created_at;

-- name: GetRequestForUser :one
SELECT r.* FROM requests r
JOIN collections c ON c.id = r.collection_id
JOIN workspaces w on w.id = c.workspace_id
WHERE r.id = $1 AND w.owner_id = $2;

-- name: UpdateRequest :one
UPDATE requests SET name = $2, method = $3, url = $4, params = $5, headers = $6, body = $7, updated_at = NOW()
WHERE id=$1 RETURNING *;

-- name: DeleteRequest :exec
DELETE FROM requests WHERE id = $1;

-- name: GetCollectionForUser :one
SELECT c.* FROM collections c
JOIN workspaces w on w.id = c.workspace_id
WHERE c.id = $1 AND w.owner_id = $2;
