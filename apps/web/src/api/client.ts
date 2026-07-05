const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// Kept in memory only — never localStorage — so an XSS payload can't read a
// long-lived credential off disk. Lost on full page reload by design; the
// refresh cookie (httpOnly, set by the API) is what survives a reload.
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
}

// 'unauthenticated' is a definitive answer from the server (no valid refresh
// token — genuinely logged out). 'network-error' means the fetch itself
// never got an answer (offline, DNS hiccup, momentary CORS/connectivity
// blip) — treating that the same as 'unauthenticated' was what made sessions
// look like they randomly logged out on a bad connection, so callers need to
// tell the two apart.
type RefreshOutcome = 'ok' | 'unauthenticated' | 'network-error'

let refreshPromise: Promise<RefreshOutcome> | null = null

async function refreshAccessTokenWithOutcome(): Promise<RefreshOutcome> {
  // Concurrent 401s (e.g. several queries firing at once) should trigger a
  // single refresh call, not one per request.
  refreshPromise ??= (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) return 'unauthenticated'
      const data = (await response.json()) as { accessToken: string }
      setAccessToken(data.accessToken)
      return 'ok'
    } catch {
      // fetch() only throws for network-level failures — an HTTP error
      // response (a real "you're not logged in" 401) is handled above.
      return 'network-error'
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

/** Proactively renews the access token — call periodically from an active session. */
export async function refreshAccessToken(): Promise<boolean> {
  return (await refreshAccessTokenWithOutcome()) === 'ok'
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401 && !isRetry && path !== '/api/auth/refresh') {
    const refreshed = await refreshAccessToken()
    if (refreshed) return apiRequest<T>(path, options, true)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as { error?: string })
    throw new ApiError(body.error ?? `Request to ${path} failed`, response.status)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

// A bad connection on app boot (e.g. opening the PWA just as the phone wakes
// up and Wi-Fi hasn't reconnected yet) shouldn't be indistinguishable from an
// expired session — retry through a few short backoffs before giving up.
const RESTORE_RETRY_DELAYS_MS = [500, 1500, 3000]

/** Attempts a silent session restore from the refresh cookie — call once on app boot. */
export async function tryRestoreSession(): Promise<boolean> {
  for (const delayMs of RESTORE_RETRY_DELAYS_MS) {
    const outcome = await refreshAccessTokenWithOutcome()
    if (outcome === 'ok') return true
    if (outcome === 'unauthenticated') return false
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return (await refreshAccessTokenWithOutcome()) === 'ok'
}
