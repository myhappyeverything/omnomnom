import type { IssuedWidgetToken, PublicWidgetToken } from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import type { WidgetTokenRow } from '../types/models.js'
import { generateOpaqueToken, sha256Hex } from '../lib/crypto.js'
import { NotFoundError } from '../lib/errors.js'
import {
  createWidgetToken,
  listWidgetTokensForUser,
  revokeWidgetToken as revokeWidgetTokenRepo,
} from '../repositories/widgetTokens.js'

function toPublicWidgetToken(row: WidgetTokenRow): PublicWidgetToken {
  return { id: row.id, label: row.label, lastUsedAt: row.last_used_at, createdAt: row.created_at }
}

/** The raw token is only ever returned here — it's never stored, only its hash. */
export async function issueWidgetToken(
  env: Env,
  userId: string,
  label: string,
): Promise<IssuedWidgetToken> {
  const token = generateOpaqueToken()
  const tokenHash = await sha256Hex(token)
  const row = await createWidgetToken(env, userId, tokenHash, label)
  return { ...toPublicWidgetToken(row), token }
}

export async function listWidgetTokens(env: Env, userId: string): Promise<PublicWidgetToken[]> {
  const rows = await listWidgetTokensForUser(env, userId)
  return rows.filter((row) => !row.revoked_at).map(toPublicWidgetToken)
}

export async function revokeWidgetToken(env: Env, userId: string, id: string): Promise<void> {
  const revoked = await revokeWidgetTokenRepo(env, userId, id)
  if (!revoked) throw new NotFoundError('Widget token not found')
}
