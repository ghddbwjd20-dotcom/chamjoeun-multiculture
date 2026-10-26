ALTER TABLE lessons ALTER COLUMN duration_seconds TYPE double precision;
CREATE INDEX video_job_queue_idx ON video_jobs(status,created_at);
