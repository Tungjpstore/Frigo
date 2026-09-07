-- Migration 0014: fence scan queue leases so stale workers cannot commit.
ALTER TABLE scan_queue_jobs ADD COLUMN claim_token TEXT;
ALTER TABLE scan_queue_jobs ADD COLUMN claim_attempt INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_scan_queue_jobs_claim
  ON scan_queue_jobs(id, claim_token, status);
