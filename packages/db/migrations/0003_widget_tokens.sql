-- Long-lived, revocable, read-only tokens for the iOS Scriptable widget.
-- Unlike refresh_tokens these never rotate or expire on their own — a widget
-- has no way to react to a token being swapped out between manual
-- re-installs, so the only way one goes away is explicit revocation from
-- account settings.
CREATE TABLE widget_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  label TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_widget_tokens_token_hash ON widget_tokens (token_hash);
CREATE INDEX idx_widget_tokens_user ON widget_tokens (user_id);
