import type { Env } from '../types/env.js'
import type { WidgetTokenRow } from '../types/models.js'
import { newId, nowIso } from '../lib/db.js'

export async function createWidgetToken(
  env: Env,
  userId: string,
  tokenHash: string,
  label: string,
): Promise<WidgetTokenRow> {
  const id = newId()
  const createdAt = nowIso()
  await env.DB.prepare(
    `INSERT INTO widget_tokens (id, user_id, token_hash, label, created_at) VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, userId, tokenHash, label, createdAt)
    .run()
  return { id, user_id: userId, token_hash: tokenHash, label, last_used_at: null, revoked_at: null, created_at: createdAt }
}

export async function findActiveWidgetTokenByHash(
  env: Env,
  tokenHash: string,
): Promise<WidgetTokenRow | null> {
  return env.DB.prepare(`SELECT * FROM widget_tokens WHERE token_hash = ? AND revoked_at IS NULL`)
    .bind(tokenHash)
    .first<WidgetTokenRow>()
}

export async function touchWidgetTokenLastUsed(env: Env, id: string): Promise<void> {
  await env.DB.prepare('UPDATE widget_tokens SET last_used_at = ? WHERE id = ?')
    .bind(nowIso(), id)
    .run()
}

export async function listWidgetTokensForUser(env: Env, userId: string): Promise<WidgetTokenRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM widget_tokens WHERE user_id = ? ORDER BY created_at DESC',
  )
    .bind(userId)
    .all<WidgetTokenRow>()
  return results
}

/** Scoped to the owning user so one account can't revoke another's token by guessing an id. Returns whether a row was actually revoked. */
export async function revokeWidgetToken(env: Env, userId: string, id: string): Promise<boolean> {
  const result = await env.DB.prepare(
    'UPDATE widget_tokens SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL',
  )
    .bind(nowIso(), id, userId)
    .run()
  return result.meta.changes > 0
}
