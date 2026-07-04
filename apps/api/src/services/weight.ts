import type { CreateWeightLogInput, WeightLogRecord } from '@purple/shared'
import type { Env } from '../types/env.js'
import type { WeightLogRow } from '../types/models.js'
import { NotFoundError } from '../lib/errors.js'
import * as weightRepo from '../repositories/weight.js'
import { nowIso } from '../lib/db.js'

function toRecord(row: WeightLogRow): WeightLogRecord {
  return {
    id: row.id,
    weightKg: row.weight_kg,
    loggedAt: row.logged_at,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export async function createWeightLog(
  env: Env,
  userId: string,
  input: CreateWeightLogInput,
): Promise<WeightLogRecord> {
  if (input.clientId) {
    const existing = await weightRepo.findWeightLogByClientId(env, userId, input.clientId)
    if (existing) return toRecord(existing)
  }
  const row = await weightRepo.createWeightLog(env, userId, {
    weightKg: input.weightKg,
    loggedAt: input.loggedAt ?? nowIso(),
    notes: input.notes ?? null,
    clientId: input.clientId ?? null,
  })
  return toRecord(row)
}

export async function listWeightLogs(
  env: Env,
  userId: string,
  range: { from?: string; to?: string },
): Promise<WeightLogRecord[]> {
  const rows = await weightRepo.listWeightLogs(env, userId, range)
  return rows.map(toRecord)
}

export async function deleteWeightLog(env: Env, userId: string, id: string): Promise<void> {
  const existing = await weightRepo.findWeightLogById(env, userId, id)
  if (!existing) throw new NotFoundError('Weight log not found')
  await weightRepo.deleteWeightLog(env, userId, id)
}
