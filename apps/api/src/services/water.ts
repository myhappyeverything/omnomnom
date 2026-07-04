import type { CreateWaterLogInput, WaterLogRecord } from '@purple/shared'
import type { Env } from '../types/env.js'
import type { WaterLogRow } from '../types/models.js'
import { NotFoundError } from '../lib/errors.js'
import * as waterRepo from '../repositories/water.js'
import { nowIso } from '../lib/db.js'

function toRecord(row: WaterLogRow): WaterLogRecord {
  return {
    id: row.id,
    amountMl: row.amount_ml,
    loggedAt: row.logged_at,
    createdAt: row.created_at,
  }
}

export async function createWaterLog(
  env: Env,
  userId: string,
  input: CreateWaterLogInput,
): Promise<WaterLogRecord> {
  if (input.clientId) {
    const existing = await waterRepo.findWaterLogByClientId(env, userId, input.clientId)
    if (existing) return toRecord(existing)
  }
  const row = await waterRepo.createWaterLog(env, userId, {
    amountMl: input.amountMl,
    loggedAt: input.loggedAt ?? nowIso(),
    clientId: input.clientId ?? null,
  })
  return toRecord(row)
}

export async function listWaterLogs(
  env: Env,
  userId: string,
  range: { from?: string; to?: string },
): Promise<WaterLogRecord[]> {
  const rows = await waterRepo.listWaterLogs(env, userId, range)
  return rows.map(toRecord)
}

export async function deleteWaterLog(env: Env, userId: string, id: string): Promise<void> {
  const existing = await waterRepo.findWaterLogById(env, userId, id)
  if (!existing) throw new NotFoundError('Water log not found')
  await waterRepo.deleteWaterLog(env, userId, id)
}
