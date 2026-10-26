ALTER TABLE posts ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE posts ADD COLUMN pinned boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN deleted_at timestamptz;
CREATE INDEX posts_board_idx ON posts(category,published,pinned DESC,created_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE attachments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid NOT NULL REFERENCES posts ON DELETE CASCADE,
 original_name text NOT NULL, mime_type text NOT NULL, size_bytes integer NOT NULL CHECK(size_bytes>0 AND size_bytes<=10485760),
 uploaded_by uuid REFERENCES users, created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE INDEX attachments_post_idx ON attachments(post_id) WHERE deleted_at IS NULL;
