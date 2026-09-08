-- Migration 0016: atomic, tenant-scoped scan quota reservations.
CREATE TABLE IF NOT EXISTS scan_quota_periods (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL,
  period_start TEXT NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  max_scans INTEGER NOT NULL DEFAULT 5,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, period_start)
);
CREATE INDEX IF NOT EXISTS idx_scan_quota_periods_household ON scan_quota_periods(household_id, period_start);

CREATE TABLE IF NOT EXISTS scan_quota_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL,
  scan_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  period_start TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reserved','consumed','released')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_scan_quota_ledger_user_period ON scan_quota_ledger(user_id, period_start, status);
