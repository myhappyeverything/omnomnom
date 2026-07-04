import type { Env } from '../types/env.js'
import type { WeightLogRow } from '../types/models.js'
import { newId, nowIso } from '../lib/db.js'

export async function findWeightLogByClientId(
  env: Env,
  userId: string,
  clientId: string,
): Promise<WeightLogRow | null> {
  return env.DB.prepare('SELECT * FROM weight_logs WHERE user_id = ? AND client_id = ?')
    .bind(userId, clientId)
    .first<WeightLogRow>()
}

export async function findWeightLogById(
  env: Env,
  userId: string,
  id: string,
): Promise<WeightLogRow | null> {
  return env.DB.prepare('SELECT * FROM weight_logs WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<WeightLogRow>()
}

export async function createWeightLog(
  env: Env,
  userId: string,
  input: { weightKg: number; loggedAt: string; notes: string | null; clientId: string | null },
): Promise<WeightLogRow> {
  const id = newId()
  await env.DB.prepare(
    'INSERT INTO weight_logs (id, user_id, weight_kg, logged_at, notes, client_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(id, userId, input.weightKg, input.loggedAt, input.notes, input.clientId, nowIso())
    .run()
  const row = await env.DB.prepare('SELECT * FROM weight_logs WHERE id = ?')
    .bind(id)
    .first<WeightLogRow>()
  if (!row) throw new Error('Failed to create weight log')
  return row
}

export async function listWeightLogs(
  env: Env,
  userId: string,
  range: { from?: string; to?: string },
): Promise<WeightLogRow[]> {
  const conditions = ['user_id = ?']
  const values: (string | number)[] = [userId]
  if (range.from) {
    conditions.push('logged_at >= ?')
    values.push(range.from)
  }
  if (range.to) {
    conditions.push('logged_at <= ?')
    values.push(range.to)
  }
  const { results } = await env.DB.prepare(
    `SELECT * FROM weight_logs WHERE ${conditions.join(' AND ')} ORDER BY logged_at DESC`,
  )
    .bind(...values)
    .all<WeightLogRow>()
  return results
}

export async function deleteWeightLog(env: Env, userId: string, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM weight_logs WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run()
}
