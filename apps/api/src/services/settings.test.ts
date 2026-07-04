import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Env } from '../types/env.js'
import { createUser } from '../repositories/users.js'
import { getSettings, updateSettings } from './settings.js'

const testEnv = env as unknown as Env

describe('settings service', () => {
  let userId: string

  beforeEach(async () => {
    const user = await createUser(testEnv, {
      name: 'Test User',
      email: `settings-${crypto.randomUUID()}@example.com`,
      passwordHash: 'h',
      passwordSalt: 's',
      passwordIterations: 1,
      dateOfBirth: '1990-01-01',
      sex: 'male',
      heightCm: 180,
    })
    userId = user.id
  })

  it('returns sensible defaults for a freshly-created user', async () => {
    const settings = await getSettings(testEnv, userId)
    expect(settings.unitSystem).toBe('metric')
    expect(settings.theme).toBe('system')
    expect(settings.updatedAt).toBeTruthy()
  })

  it('persists a partial patch without touching untouched fields', async () => {
    const updated = await updateSettings(testEnv, userId, { theme: 'dark' })
    expect(updated.theme).toBe('dark')
    expect(updated.unitSystem).toBe('metric') // unchanged

    const refetched = await getSettings(testEnv, userId)
    expect(refetched.theme).toBe('dark')
    expect(refetched.unitSystem).toBe('metric')
  })

  it('persists multiple fields in a single patch', async () => {
    const updated = await updateSettings(testEnv, userId, {
      unitSystem: 'imperial',
      theme: 'light',
    })
    expect(updated.unitSystem).toBe('imperial')
    expect(updated.theme).toBe('light')
  })

  it('updates the updatedAt timestamp on patch', async () => {
    const before = await getSettings(testEnv, userId)
    await new Promise((resolve) => setTimeout(resolve, 5))
    const after = await updateSettings(testEnv, userId, { theme: 'dark' })
    expect(new Date(after.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(before.updatedAt).getTime(),
    )
  })

  it('scopes settings to the owning user', async () => {
    const otherUser = await createUser(testEnv, {
      name: 'Other User',
      email: `settings-other-${crypto.randomUUID()}@example.com`,
      passwordHash: 'h',
      passwordSalt: 's',
      passwordIterations: 1,
      dateOfBirth: '1990-01-01',
      sex: 'female',
      heightCm: 165,
    })

    await updateSettings(testEnv, userId, { theme: 'dark' })
    const otherSettings = await getSettings(testEnv, otherUser.id)
    expect(otherSettings.theme).toBe('system')
  })
})
