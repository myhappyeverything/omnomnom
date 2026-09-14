import type { Env } from '../types/env.js'
import { newId, nowIso } from '../lib/db.js'

export interface PasswordResetRow {
  id: string
  user_id: string
  code_hash: string
  expires_at: string
  used: number
  created_at: string
}

/** Replace any existing codes for the user with a single fresh one. */
export async function createResetCode(
  env: Env,
  userId: string,
  codeHash: string,
  expiresAt: string,
): Promise<void> {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM password_reset_codes WHERE user_id = ?').bind(userId),
    env.DB.prepare(
      'INSERT INTO password_reset_codes (id, user_id, code_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    ).bind(newId(), userId, codeHash, expiresAt, nowIso()),
  ])
}

export async function findValidResetCode(
  env: Env,
  userId: string,
  codeHash: string,
): Promise<PasswordResetRow | null> {
  return env.DB.prepare(
    'SELECT * FROM password_reset_codes WHERE user_id = ? AND code_hash = ? AND used = 0 AND expires_at > ? LIMIT 1',
  )
    .bind(userId, codeHash, nowIso())
    .first<PasswordResetRow>()
}

export async function consumeResetCodes(env: Env, userId: string): Promise<void> {
  await env.DB.prepare('DELETE FROM password_reset_codes WHERE user_id = ?').bind(userId).run()
}
