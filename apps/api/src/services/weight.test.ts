import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Env } from '../types/env.js'
import { createUser } from '../repositories/users.js'
import { createWeightLog, listWeightLogs } from './weight.js'

const testEnv = env as unknown as Env

async function makeUser(email: string) {
  return createUser(testEnv, {
    name: 'Test User',
    email,
    passwordHash: 'h',
    passwordSalt: 's',
    passwordIterations: 1,
    dateOfBirth: '1990-01-01',
    sex: 'female',
    heightCm: 165,
  })
}

describe('createWeightLog', () => {
  let userId: string

  beforeEach(async () => {
    const user = await makeUser(`weight-${crypto.randomUUID()}@example.com`)
    userId = user.id
  })

  it('creates a new weight log', async () => {
    const record = await createWeightLog(testEnv, userId, { weightKg: 70.5 })
    expect(record.weightKg).toBe(70.5)
    expect(record.id).toBeTruthy()
  })

  it('is idempotent for repeated calls with the same clientId', async () => {
    const first = await createWeightLog(testEnv, userId, { weightKg: 70.5, clientId: 'client-1' })
    const second = await createWeightLog(testEnv, userId, {
      weightKg: 70.5,
      clientId: 'client-1',
    })

    expect(second.id).toBe(first.id)

    const logs = await listWeightLogs(testEnv, userId, {})
    expect(logs).toHaveLength(1)
  })

  it('creates separate rows for calls with different clientIds', async () => {
    await createWeightLog(testEnv, userId, { weightKg: 70, clientId: 'client-a' })
    await createWeightLog(testEnv, userId, { weightKg: 71, clientId: 'client-b' })

    const logs = await listWeightLogs(testEnv, userId, {})
    expect(logs).toHaveLength(2)
  })

  it('creates separate rows for calls with no clientId at all', async () => {
    await createWeightLog(testEnv, userId, { weightKg: 70 })
    await createWeightLog(testEnv, userId, { weightKg: 70 })

    const logs = await listWeightLogs(testEnv, userId, {})
    expect(logs).toHaveLength(2)
  })

  it('persists optional notes', async () => {
    const record = await createWeightLog(testEnv, userId, {
      weightKg: 70,
      notes: 'after breakfast',
    })
    expect(record.notes).toBe('after breakfast')
  })
})
