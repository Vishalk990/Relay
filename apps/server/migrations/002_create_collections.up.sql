CREATE TABLE collections (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id    UUID        REFERENCES collections(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    position     INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_workspace_id ON collections(workspace_id);
CREATE INDEX idx_collections_parent_id    ON collections(parent_id);
