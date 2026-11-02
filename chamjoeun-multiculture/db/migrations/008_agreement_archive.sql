CREATE TABLE agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  post_id uuid NOT NULL UNIQUE REFERENCES posts,
  partner_name text NOT NULL,
  signed_on text NOT NULL CHECK(signed_on ~ '^\d{4}-\d{2}(-\d{2})?$'),
  parties jsonb NOT NULL CHECK(jsonb_typeof(parties)='array'),
  review_status text NOT NULL CHECK(review_status IN ('reviewed','needs_review')),
  review_note text NOT NULL DEFAULT '',
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE agreement_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES agreements ON DELETE CASCADE,
  source_path text NOT NULL UNIQUE,
  original_name text NOT NULL,
  mime_type text NOT NULL CHECK(mime_type IN ('application/pdf','image/jpeg','image/png')),
  sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
  size_bytes integer NOT NULL CHECK(size_bytes>0 AND size_bytes<=10485760),
  data bytea NOT NULL,
  CHECK(octet_length(data)=size_bytes),
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX agreement_documents_agreement_idx ON agreement_documents(agreement_id);
