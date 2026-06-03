CREATE TABLE
    users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    user_identities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID NOT NULL REFERENCES users (id) on DELETE CASCADE,
        provider TEXT NOT NULL CHECK (provider IN ('password', 'google', 'github')),
        provider_subject TEXT NOT NULL,
        credential TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        UNIQUE (provider, provider_subject)
    );

CREATE INDEX idx_user_identities_user_id ON user_identities (user_id);

CREATE TABLE
    workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        owner_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE INDEX idx_workspaces_owner_id ON workspaces (owner_id);