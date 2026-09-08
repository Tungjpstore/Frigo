-- P0 auth hardening: opaque cookie sessions and hashed OTP challenges.
CREATE TABLE IF NOT EXISTS sessions_v2 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_v2_token_hash ON sessions_v2(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_v2_user_id ON sessions_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_v2_expires ON sessions_v2(expires_at);

ALTER TABLE auth_otps ADD COLUMN code_digest TEXT;
ALTER TABLE auth_otps ADD COLUMN digest_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE auth_otps ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE auth_otps ADD COLUMN locked_until TEXT;
ALTER TABLE auth_otps ADD COLUMN used_at TEXT;
CREATE INDEX IF NOT EXISTS idx_auth_otps_digest ON auth_otps(email, purpose, code_digest);

-- All legacy JWT sessions are intentionally invalidated at the cookie-session
-- cutover. The old table is retained only until the follow-up drop migration.
DELETE FROM sessions;
