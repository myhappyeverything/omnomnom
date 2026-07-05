import type { Env } from '../types/env.js'
import type { RefreshTokenRow } from '../types/models.js'
import { newId, nowIso } from '../lib/db.js'

export async function createRefreshToken(
  env: Env,
  userId: string,
  tokenHash: string,
  expiresAt: string,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(newId(), userId, tokenHash, expiresAt, nowIso())
    .run()
}

export async function findActiveRefreshTokenByHash(
  env: Env,
  tokenHash: string,
): Promise<RefreshTokenRow | null> {
  return env.DB.prepare(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?`,
  )
    .bind(tokenHash, nowIso())
    .first<RefreshTokenRow>()
}

export async function revokeRefreshToken(env: Env, id: string): Promise<void> {
  await env.DB.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?')
    .bind(nowIso(), id)
    .run()
}

/**
 * Used on rotation instead of an immediate hard revoke: pulls the token's
 * expiry forward to a short grace window rather than killing it outright.
 * Multiple tabs/devices sharing one browser's cookie jar can otherwise race
 * to refresh with the same (about-to-be-rotated) token — without a grace
 * window, whichever request loses the race gets "Invalid or expired refresh
 * token" and the session looks like it randomly logged out. Leaving
 * `revoked_at` null keeps `findActiveRefreshTokenByHash` finding it until the
 * short window elapses, after which its `expires_at` check fails it as normal.
 */
export async function graceExpireRefreshToken(
  env: Env,
  id: string,
  graceSeconds: number,
): Promise<void> {
  const expiresAt = new Date(Date.now() + graceSeconds * 1000).toISOString()
  await env.DB.prepare('UPDATE refresh_tokens SET expires_at = ? WHERE id = ?')
    .bind(expiresAt, id)
    .run()
}

export async function revokeAllRefreshTokensForUser(env: Env, userId: string): Promise<void> {
  await env.DB.prepare(
    'UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL',
  )
    .bind(nowIso(), userId)
    .run()
}
