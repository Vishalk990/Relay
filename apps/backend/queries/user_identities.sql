-- name: CreateIdentity :one
INSERT INTO user_identities (user_id, provider, provider_subject, credential)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetIdentityByProviderSubject :one
SELECT * FROM user_identities
WHERE provider = $1 AND provider_subject = $2;

-- name: ListIdentitiesForUser :many
SELECT * FROM user_identities
WHERE user_id = $1
ORDER BY created_at;
