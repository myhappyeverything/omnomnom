import { sign, verify } from 'hono/jwt'

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60

export interface AccessTokenPayload {
  sub: string
  exp: number
  [key: string]: unknown
}

export async function createAccessToken(userId: string, secret: string): Promise<string> {
  const payload: AccessTokenPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
  }
  return sign(payload, secret, 'HS256')
}

/** Returns the authenticated user id, or null if the token is missing, malformed, or expired. */
export async function verifyAccessToken(token: string, secret: string): Promise<string | null> {
  try {
    const payload = (await verify(token, secret, 'HS256')) as AccessTokenPayload
    return payload.sub
  } catch {
    return null
  }
}
