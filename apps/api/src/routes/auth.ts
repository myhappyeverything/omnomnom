import { Hono, type Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { registerSchema, loginSchema } from '@purple/shared'
import type { AppEnv } from '../types/hono.js'
import type { AuthTokens } from '../services/auth.js'
import {
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
  toPublicUser,
} from '../services/auth.js'
import { UnauthorizedError } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { findUserById } from '../repositories/users.js'
import { REFRESH_TOKEN_TTL_SECONDS } from '../lib/tokens.js'

const REFRESH_COOKIE_NAME = 'purple_refresh_token'
const REFRESH_COOKIE_PATH = '/api/auth'

export const authRoute = new Hono<AppEnv>()

function setRefreshCookie(c: Context<AppEnv>, token: string) {
  setCookie(c, REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT !== 'development',
    sameSite: 'Strict',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  })
}

function tokensResponse(tokens: AuthTokens) {
  return { accessToken: tokens.accessToken }
}

authRoute.post(
  '/register',
  rateLimit({ keyPrefix: 'register', limit: 5, windowSeconds: 60 * 60 }),
  zValidator('json', registerSchema),
  async (c) => {
    const { user, tokens } = await registerUser(c.env, c.req.valid('json'))
    setRefreshCookie(c, tokens.refreshToken)
    return c.json({ user: toPublicUser(user), ...tokensResponse(tokens) }, 201)
  },
)

authRoute.post(
  '/login',
  rateLimit({ keyPrefix: 'login', limit: 10, windowSeconds: 15 * 60 }),
  zValidator('json', loginSchema),
  async (c) => {
    const { user, tokens } = await loginUser(c.env, c.req.valid('json'))
    setRefreshCookie(c, tokens.refreshToken)
    return c.json({ user: toPublicUser(user), ...tokensResponse(tokens) })
  },
)

authRoute.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, REFRESH_COOKIE_NAME)
  if (!refreshToken) {
    throw new UnauthorizedError('Missing refresh token')
  }
  const tokens = await refreshSession(c.env, refreshToken)
  setRefreshCookie(c, tokens.refreshToken)
  return c.json(tokensResponse(tokens))
})

authRoute.post('/logout', async (c) => {
  const refreshToken = getCookie(c, REFRESH_COOKIE_NAME)
  if (refreshToken) {
    await logoutSession(c.env, refreshToken)
  }
  deleteCookie(c, REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH })
  return c.json({ success: true })
})

authRoute.get('/me', requireAuth, async (c) => {
  const user = await findUserById(c.env, c.get('userId'))
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  return c.json({ user: toPublicUser(user) })
})
