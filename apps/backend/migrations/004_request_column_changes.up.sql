ALTER TABLE requests ADD COLUMN params JSONB NOT NULL DEFAULT '[]'::jsonb;

