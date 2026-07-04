import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Env } from '../types/env.js'
import type { RegisterInput } from '@omnomnom/shared'
import { ConflictError, UnauthorizedError } from '../lib/errors.js'
import { findUserById } from '../repositories/users.js'
import { createWaterLog } from './water.js'
import { deleteAccount, loginUser, registerUser } from './auth.js'

const testEnv = env as unknown as Env

function makeRegisterInput(overrides: Partial<RegisterInput> = {}): RegisterInput {
  return {
    name: 'Test User',
    email: `auth-${crypto.randomUUID()}@example.com`,
    password: 'correct horse battery staple',
    dateOfBirth: '1990-01-01',
    sex: 'male',
    heightCm: 180,
    ...overrides,
  }
}

describe('registerUser / loginUser round trip', () => {
  it('registers a user and can immediately log in with the correct password', async () => {
    const input = makeRegisterInput()
    const { user, tokens } = await registerUser(testEnv, input)

    expect(user.email).toBe(input.email)
    expect(tokens.accessToken).toBeTruthy()
    expect(tokens.refreshToken).toBeTruthy()

    const { user: loggedInUser } = await loginUser(testEnv, {
      email: input.email,
      password: input.password,
    })
    expect(loggedInUser.id).toBe(user.id)
  })

  it('rejects login with the wrong password with an UnauthorizedError', async () => {
    const input = makeRegisterInput()
    await registerUser(testEnv, input)

    await expect(
      loginUser(testEnv, { email: input.email, password: 'totally wrong password' }),
    ).rejects.toThrow(UnauthorizedError)
  })

  it('rejects login for an email that was never registered with the same UnauthorizedError', async () => {
    await expect(
      loginUser(testEnv, { email: 'nobody@example.com', password: 'whatever12345' }),
    ).rejects.toThrow(UnauthorizedError)
  })

  it('rejects a second registration with the same email', async () => {
    const input = makeRegisterInput()
    await registerUser(testEnv, input)
    await expect(registerUser(testEnv, input)).rejects.toThrow(ConflictError)
  })

  it('does not cap the number of registered accounts', async () => {
    for (let i = 0; i < 5; i++) {
      await registerUser(testEnv, makeRegisterInput())
    }
  })
})

describe('deleteAccount', () => {
  let userId: string

  beforeEach(async () => {
    const { user } = await registerUser(testEnv, makeRegisterInput())
    userId = user.id
  })

  it('removes the user row', async () => {
    await deleteAccount(testEnv, userId)
    expect(await findUserById(testEnv, userId)).toBeNull()
  })

  it('cascades the delete to child tables (water_logs) via ON DELETE CASCADE', async () => {
    await createWaterLog(testEnv, userId, { amountMl: 500 })

    const before = await testEnv.DB.prepare(
      'SELECT COUNT(*) as count FROM water_logs WHERE user_id = ?',
    )
      .bind(userId)
      .first<{ count: number }>()
    expect(before?.count).toBe(1)

    await deleteAccount(testEnv, userId)

    const after = await testEnv.DB.prepare(
      'SELECT COUNT(*) as count FROM water_logs WHERE user_id = ?',
    )
      .bind(userId)
      .first<{ count: number }>()
    expect(after?.count).toBe(0)
  })

  it('also cascades to the 1:1 settings row', async () => {
    await deleteAccount(testEnv, userId)
    const settings = await testEnv.DB.prepare('SELECT * FROM settings WHERE user_id = ?')
      .bind(userId)
      .first()
    expect(settings).toBeNull()
  })
})
