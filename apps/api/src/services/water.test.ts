import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Env } from '../types/env.js'
import { createUser } from '../repositories/users.js'
import { createWaterLog, listWaterLogs } from './water.js'

const testEnv = env as unknown as Env

async function makeUser(email: string) {
  return createUser(testEnv, {
    name: 'Test User',
    email,
    passwordHash: 'h',
    passwordSalt: 's',
    passwordIterations: 1,
    dateOfBirth: '1990-01-01',
    sex: 'male',
    heightCm: 180,
  })
}

describe('createWaterLog', () => {
  let userId: string

  beforeEach(async () => {
    const user = await makeUser(`water-${crypto.randomUUID()}@example.com`)
    userId = user.id
  })

  it('creates a new water log', async () => {
    const record = await createWaterLog(testEnv, userId, { amountMl: 250 })
    expect(record.amountMl).toBe(250)
    expect(record.id).toBeTruthy()
  })

  it('is idempotent for repeated calls with the same clientId', async () => {
    const first = await createWaterLog(testEnv, userId, { amountMl: 250, clientId: 'client-1' })
    const second = await createWaterLog(testEnv, userId, { amountMl: 250, clientId: 'client-1' })

    expect(second.id).toBe(first.id)

    const logs = await listWaterLogs(testEnv, userId, {})
    expect(logs).toHaveLength(1)
  })

  it('ignores a differing payload on a repeated clientId call and returns the original record', async () => {
    const first = await createWaterLog(testEnv, userId, { amountMl: 250, clientId: 'client-dup' })
    // Simulates a retried offline mutation that (incorrectly) sends a different amount —
    // dedup must win, since the first write is treated as the source of truth.
    const second = await createWaterLog(testEnv, userId, { amountMl: 999, clientId: 'client-dup' })

    expect(second.amountMl).toBe(first.amountMl)
    expect(second.id).toBe(first.id)

    const logs = await listWaterLogs(testEnv, userId, {})
    expect(logs).toHaveLength(1)
  })

  it('creates separate rows for calls with different clientIds', async () => {
    await createWaterLog(testEnv, userId, { amountMl: 250, clientId: 'client-a' })
    await createWaterLog(testEnv, userId, { amountMl: 250, clientId: 'client-b' })

    const logs = await listWaterLogs(testEnv, userId, {})
    expect(logs).toHaveLength(2)
  })

  it('creates separate rows for calls with no clientId at all', async () => {
    await createWaterLog(testEnv, userId, { amountMl: 250 })
    await createWaterLog(testEnv, userId, { amountMl: 250 })

    const logs = await listWaterLogs(testEnv, userId, {})
    expect(logs).toHaveLength(2)
  })

  it('scopes clientId dedup to the owning user', async () => {
    const otherUser = await makeUser(`water-other-${crypto.randomUUID()}@example.com`)

    await createWaterLog(testEnv, userId, { amountMl: 250, clientId: 'shared-client-id' })
    await createWaterLog(testEnv, otherUser.id, { amountMl: 500, clientId: 'shared-client-id' })

    const userLogs = await listWaterLogs(testEnv, userId, {})
    const otherLogs = await listWaterLogs(testEnv, otherUser.id, {})
    expect(userLogs).toHaveLength(1)
    expect(otherLogs).toHaveLength(1)
    expect(userLogs[0]?.amountMl).toBe(250)
    expect(otherLogs[0]?.amountMl).toBe(500)
  })
})
