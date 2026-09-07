-- Remove legacy plaintext OTP storage. Existing challenges are invalidated
-- during the rebuild; new challenges use HMAC digests only.
CREATE TABLE auth_otps_v2 (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_digest TEXT NOT NULL,
  digest_version INTEGER NOT NULL DEFAULT 1,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO auth_otps_v2 (id, email, code_digest, digest_version, purpose, expires_at, used, attempt_count, locked_until, used_at, created_at)
SELECT id, email, code_digest, digest_version, purpose, expires_at, used, attempt_count, locked_until, used_at, created_at
  FROM auth_otps
 WHERE code_digest IS NOT NULL;
DROP TABLE auth_otps;
ALTER TABLE auth_otps_v2 RENAME TO auth_otps;
CREATE INDEX idx_auth_otps_email_purpose ON auth_otps(email, purpose);
CREATE INDEX idx_auth_otps_digest ON auth_otps(email, purpose, code_digest);
