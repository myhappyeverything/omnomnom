import type { RegisterInput, LoginInput, PublicUser } from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import type { UserRow } from '../types/models.js'
import { hashPassword, verifyPassword, generateOpaqueToken, sha256Hex } from '../lib/crypto.js'
import { createAccessToken, REFRESH_TOKEN_TTL_SECONDS } from '../lib/tokens.js'
import { ConflictError, UnauthorizedError } from '../lib/errors.js'
import { createUser, deleteUser, findUserByEmail, updateUserPassword } from '../repositories/users.js'
import { createResetCode, findValidResetCode, consumeResetCodes } from '../repositories/passwordResets.js'
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

/**
 * Deletes the account and every row tied to it. Most tables cascade on
 * user_id / created_by_user_id, but meal_items.food_id and recipe_items.food_id
 * are ON DELETE RESTRICT, so a user's own custom foods can't be cascade-deleted
 * while their line items still reference them. We clear those line items first,
 * then delete the user so the remaining tables (including the user's custom
 * foods) cascade cleanly.
 *
 * Meal photos live in a shared, content-addressed R2 cache (keyed by image
 * hash, deliberately de-duplicated across users), so they are intentionally not
 * deleted here — once the user's meals are gone there is no link back to them.
 */
export async function deleteAccount(env: Env, userId: string): Promise<void> {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM meal_items WHERE meal_id IN (SELECT id FROM meals WHERE user_id = ?)').bind(userId),
    env.DB.prepare('DELETE FROM recipe_items WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = ?)').bind(userId),
  ])
  await deleteUser(env, userId)
}

const RESET_CODE_TTL_SECONDS = 15 * 60

function generateNumericCode(): string {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return String((bytes[0] ?? 0) % 1_000_000).padStart(6, '0')
}

/**
 * Create a reset code for the email if an account exists. Returns the code and
 * name so the route can deliver them via the webhook; returns null when there's
 * no match (the route still responds 200 so it can't be used to probe emails).
 */
export async function requestPasswordReset(
  env: Env,
  email: string,
): Promise<{ name: string; code: string } | null> {
  const user = await findUserByEmail(env, email)
  if (!user) return null
  const code = generateNumericCode()
  const codeHash = await sha256Hex(code)
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_SECONDS * 1000).toISOString()
  await createResetCode(env, user.id, codeHash, expiresAt)
  return { name: user.name, code }
}

/** Verify a 6-digit reset code and set a new password. */
export async function resetPassword(
  env: Env,
  email: string,
  code: string,
  password: string,
): Promise<void> {
  const user = await findUserByEmail(env, email)
  if (!user) throw new UnauthorizedError('Invalid or expired code')
  const match = await findValidResetCode(env, user.id, await sha256Hex(code))
  if (!match) throw new UnauthorizedError('Invalid or expired code')
  const { hash, salt, iterations } = await hashPassword(password)
  await updateUserPassword(env, user.id, { hash, salt, iterations })
  await consumeResetCodes(env, user.id)
}
