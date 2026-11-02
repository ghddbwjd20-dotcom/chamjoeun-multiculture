-- Only inquiries submitted during an authenticated session belong to an account.
-- Never assign historical inquiries by matching an unverified email address.
ALTER TABLE inquiries ADD COLUMN user_id uuid REFERENCES users ON DELETE SET NULL;
CREATE INDEX inquiries_user_created_idx ON inquiries(user_id, created_at DESC, id DESC) WHERE user_id IS NOT NULL;
