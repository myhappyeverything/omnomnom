-- Short-lived one-time codes for the "forgot password" flow. A 6-digit code is
-- emailed via the password-reset webhook; only its SHA-256 hash is stored.
CREATE TABLE password_reset_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_password_reset_codes_user ON password_reset_codes (user_id);
