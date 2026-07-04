import type { Env } from '../types/env.js'
import type { WaterLogRow } from '../types/models.js'
import { newId, nowIso } from '../lib/db.js'

export async function findWaterLogByClientId(
  env: Env,
  userId: string,
  clientId: string,
): Promise<WaterLogRow | null> {
  return env.DB.prepare('SELECT * FROM water_logs WHERE user_id = ? AND client_id = ?')
    .bind(userId, clientId)
    .first<WaterLogRow>()
}

export async function createWaterLog(
  env: Env,
  userId: string,
  input: { amountMl: number; loggedAt: string; clientId: string | null },
): Promise<WaterLogRow> {
  const id = newId()
  await env.DB.prepare(
    'INSERT INTO water_logs (id, user_id, amount_ml, logged_at, client_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, userId, input.amountMl, input.loggedAt, input.clientId, nowIso())
    .run()
  const row = await env.DB.prepare('SELECT * FROM water_logs WHERE id = ?')
    .bind(id)
    .first<WaterLogRow>()
  if (!row) throw new Error('Failed to create water log')
  return row
}

export async function listWaterLogs(
  env: Env,
  userId: string,
  range: { from?: string; to?: string },
): Promise<WaterLogRow[]> {
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
    `SELECT * FROM water_logs WHERE ${conditions.join(' AND ')} ORDER BY logged_at DESC`,
  )
    .bind(...values)
    .all<WaterLogRow>()
  return results
}

export async function findWaterLogById(
  env: Env,
  userId: string,
  id: string,
): Promise<WaterLogRow | null> {
  return env.DB.prepare('SELECT * FROM water_logs WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<WaterLogRow>()
}

export async function deleteWaterLog(env: Env, userId: string, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM water_logs WHERE id = ? AND user_id = ?').bind(id, userId).run()
}
