-- Migration 0004: Complete Authentication System (Email/Password, Google OAuth, OTP Verification)

-- 1. Auth Accounts
CREATE TABLE IF NOT EXISTS auth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  salt TEXT,
  google_id TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_email ON auth_accounts(email);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_google ON auth_accounts(google_id);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_user ON auth_accounts(user_id);

-- 2. Auth OTP Verification
CREATE TABLE IF NOT EXISTS auth_otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'register', 'forgot_password', 'login'
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_auth_otps_email_purpose ON auth_otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_auth_otps_code ON auth_otps(code);
