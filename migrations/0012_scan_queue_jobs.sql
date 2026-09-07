-- Migration 0012: durable scan queue state and retry metadata.
--
-- The queue itself is at-least-once. This ledger makes claims idempotent and
-- leaves an operator-visible trail when a message is retried or permanently
-- failed. It is additive and safe to replay.
CREATE TABLE IF NOT EXISTS scan_queue_jobs (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  idempotency_key TEXT NOT NULL UNIQUE,
  error_code TEXT,
  error_message TEXT,
  locked_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scan_queue_jobs_status
  ON scan_queue_jobs(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_scan_queue_jobs_scan
  ON scan_queue_jobs(scan_id);
