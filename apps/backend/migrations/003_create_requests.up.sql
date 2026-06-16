CREATE TABLE requests (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID        NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    name          TEXT        NOT NULL,
    method        TEXT        NOT NULL,
    url           TEXT        NOT NULL,
    headers       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    body          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    auth          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    position      INTEGER     NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_collection_id ON requests(collection_id);
