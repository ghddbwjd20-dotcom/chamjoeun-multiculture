CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text UNIQUE NOT NULL,
 password_hash text NOT NULL, role text NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')),
 email_verified_at timestamptz, marketing_consent boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (token_hash text PRIMARY KEY, user_id uuid REFERENCES users ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE TABLE auth_tokens (token_hash text PRIMARY KEY, user_id uuid REFERENCES users ON DELETE CASCADE, purpose text NOT NULL CHECK(purpose IN ('verify','reset')), expires_at timestamptz NOT NULL);
CREATE TABLE rate_limits (key text PRIMARY KEY, count integer NOT NULL, reset_at timestamptz NOT NULL);
CREATE TABLE courses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text UNIQUE NOT NULL, title text NOT NULL, category text NOT NULL,
 summary text NOT NULL, description text NOT NULL DEFAULT '', instructor text NOT NULL DEFAULT '',
 price integer NOT NULL DEFAULT 0 CHECK(price>=0), duration_days integer NOT NULL DEFAULT 90 CHECK(duration_days>0),
 completion_threshold integer NOT NULL DEFAULT 90 CHECK(completion_threshold BETWEEN 1 AND 100),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE lessons (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES courses ON DELETE CASCADE,
 title text NOT NULL, position integer NOT NULL, duration_seconds integer NOT NULL DEFAULT 0 CHECK(duration_seconds>=0),
 video_key text, video_status text NOT NULL DEFAULT 'pending' CHECK(video_status IN ('pending','processing','ready','failed')),
 UNIQUE(course_id,position)
);
CREATE TABLE enrollments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users, course_id uuid NOT NULL REFERENCES courses,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','cancelled')),
 enrolled_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, completed_at timestamptz,
 UNIQUE(user_id,course_id)
);
CREATE TABLE lesson_progress (
 user_id uuid REFERENCES users, lesson_id uuid REFERENCES lessons, watched_ranges jsonb NOT NULL DEFAULT '[]',
 watched_seconds numeric NOT NULL DEFAULT 0, last_position numeric NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,lesson_id)
);
CREATE TABLE watch_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users, lesson_id uuid REFERENCES lessons,
 last_position numeric NOT NULL DEFAULT 0, last_ping_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
CREATE TABLE inquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL, kind text NOT NULL,
 subject text NOT NULL, message text NOT NULL, status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','answered')),
 answer text, answered_by uuid REFERENCES users, answered_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE posts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, category text NOT NULL, body text NOT NULL, published boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE audit_logs (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id uuid REFERENCES users, action text NOT NULL, entity_id text, detail jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE video_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lesson_id uuid REFERENCES lessons, source_key text NOT NULL, status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','ready','failed')), attempts integer NOT NULL DEFAULT 0, error text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users, course_id uuid REFERENCES courses, amount integer NOT NULL CHECK(amount>=0), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','cancelled')), payment_key text UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE issued_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users, course_id uuid REFERENCES courses, document_number text UNIQUE NOT NULL, kind text NOT NULL CHECK(kind IN ('completion','qualification')), issued_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX enrollments_user_idx ON enrollments(user_id);
CREATE INDEX lessons_course_idx ON lessons(course_id);
CREATE INDEX inquiries_created_idx ON inquiries(created_at DESC);
