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

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  // Concurrent 401s (e.g. several queries firing at once) should trigger a
  // single refresh call, not one per request.
  refreshPromise ??= (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) return false
      const data = (await response.json()) as { accessToken: string }
      setAccessToken(data.accessToken)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
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

/** Attempts a silent session restore from the refresh cookie — call once on app boot. */
export async function tryRestoreSession(): Promise<boolean> {
  return refreshAccessToken()
}
