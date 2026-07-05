import type { RegisterInput, LoginInput, PublicUser } from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import type { UserRow } from '../types/models.js'
import { hashPassword, verifyPassword, generateOpaqueToken, sha256Hex } from '../lib/crypto.js'
import { createAccessToken, REFRESH_TOKEN_TTL_SECONDS } from '../lib/tokens.js'
import { ConflictError, UnauthorizedError } from '../lib/errors.js'
import { createUser, deleteUser, findUserByEmail } from '../repositories/users.js'
import {
  createRefreshToken,
  findActiveRefreshTokenByHash,
  graceExpireRefreshToken,
  revokeRefreshToken,
} from '../repositories/refreshTokens.js'

// How long a just-rotated refresh token still works — covers concurrent
// refresh calls from multiple tabs/devices sharing the same browser cookie.
const REFRESH_GRACE_PERIOD_SECONDS = 30

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    dateOfBirth: row.date_of_birth,
    sex: row.sex,
    heightCm: row.height_cm,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function issueTokens(env: Env, userId: string): Promise<AuthTokens> {
  const accessToken = await createAccessToken(userId, env.JWT_SECRET)
  const refreshToken = generateOpaqueToken()
  const tokenHash = await sha256Hex(refreshToken)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString()
  await createRefreshToken(env, userId, tokenHash, expiresAt)
  return { accessToken, refreshToken }
}

export async function registerUser(
  env: Env,
  input: RegisterInput,
): Promise<{ user: UserRow; tokens: AuthTokens }> {
  const existing = await findUserByEmail(env, input.email)
  if (existing) {
    throw new ConflictError('An account with this email already exists')
  }

  const { hash, salt, iterations } = await hashPassword(input.password)
  const user = await createUser(env, {
    name: input.name,
    email: input.email,
    passwordHash: hash,
    passwordSalt: salt,
    passwordIterations: iterations,
    dateOfBirth: input.dateOfBirth,
    sex: input.sex,
    heightCm: input.heightCm,
  })

  const tokens = await issueTokens(env, user.id)
  return { user, tokens }
}

export async function loginUser(
  env: Env,
  input: LoginInput,
): Promise<{ user: UserRow; tokens: AuthTokens }> {
  const user = await findUserByEmail(env, input.email)
  // Same error for "no such user" and "wrong password" so login can't be used to enumerate accounts.
  if (!user) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const valid = await verifyPassword(input.password, {
    hash: user.password_hash,
    salt: user.password_salt,
    iterations: user.password_iterations,
  })
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const tokens = await issueTokens(env, user.id)
  return { user, tokens }
}

export async function refreshSession(env: Env, rawRefreshToken: string): Promise<AuthTokens> {
  const tokenHash = await sha256Hex(rawRefreshToken)
  const existing = await findActiveRefreshTokenByHash(env, tokenHash)
  if (!existing) {
    throw new UnauthorizedError('Invalid or expired refresh token')
  }

  // Rotate on every use. The old token isn't revoked outright — it's given a
  // short grace period (see graceExpireRefreshToken) so a concurrent refresh
  // from another tab/device using the same cookie doesn't spuriously fail.
  await graceExpireRefreshToken(env, existing.id, REFRESH_GRACE_PERIOD_SECONDS)
  return issueTokens(env, existing.user_id)
}

export async function logoutSession(env: Env, rawRefreshToken: string): Promise<void> {
  const tokenHash = await sha256Hex(rawRefreshToken)
  const existing = await findActiveRefreshTokenByHash(env, tokenHash)
  if (existing) {
    await revokeRefreshToken(env, existing.id)
  }
}

/** Deletes the user row; every other table cascades on user_id/created_by_user_id. */
export async function deleteAccount(env: Env, userId: string): Promise<void> {
  await deleteUser(env, userId)
}
