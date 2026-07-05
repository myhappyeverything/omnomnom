import { Hono, type Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { registerSchema, loginSchema, updateProfileSchema } from '@omnomnom/shared'
import type { AppEnv } from '../types/hono.js'
import type { AuthTokens } from '../services/auth.js'
import {
  deleteAccount,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
  toPublicUser,
} from '../services/auth.js'
import { UnauthorizedError } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { findUserById, updateUser } from '../repositories/users.js'
import { REFRESH_TOKEN_TTL_SECONDS } from '../lib/tokens.js'

const REFRESH_COOKIE_NAME = 'omnomnom_refresh_token'
const REFRESH_COOKIE_PATH = '/api/auth'

export const authRoute = new Hono<AppEnv>()

// The frontend (Cloudflare Pages, *.pages.dev) and this API (Cloudflare
// Workers, *.workers.dev) are different registrable domains, so every request
// between them is cross-site. `SameSite=Strict` (and even `Lax`, for a POST
// like /refresh) is silently dropped by the browser on cross-site fetches —
// the cookie would never actually be sent back, which is what caused sessions
// to intermittently "log out" whenever the in-memory access token expired or
// the app was reloaded. `None` is the only setting that works cross-site, and
// requires `Secure` (already true outside local dev).
function setRefreshCookie(c: Context<AppEnv>, token: string) {
  setCookie(c, REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT !== 'development',
    sameSite: c.env.ENVIRONMENT !== 'development' ? 'None' : 'Lax',
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

authRoute.patch('/me', requireAuth, zValidator('json', updateProfileSchema), async (c) => {
  const user = await updateUser(c.env, c.get('userId'), c.req.valid('json'))
  return c.json({ user: toPublicUser(user) })
})

authRoute.delete('/me', requireAuth, async (c) => {
  await deleteAccount(c.env, c.get('userId'))
  deleteCookie(c, REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH })
  return c.json({ success: true })
})
