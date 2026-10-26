CREATE TABLE attachment_files (
  id uuid PRIMARY KEY,
  data bytea NOT NULL CHECK (octet_length(data) <= 10485760),
  created_at timestamptz NOT NULL DEFAULT now()
);
