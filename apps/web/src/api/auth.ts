import type { LoginInput, PublicUser, RegisterInput } from '@purple/shared'
import { apiRequest, setAccessToken } from './client'

interface AuthResponse {
  user: PublicUser
  accessToken: string
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const data = await apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: input })
  setAccessToken(data.accessToken)
  return data.user
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const data = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: input,
  })
  setAccessToken(data.accessToken)
  return data.user
}

export async function logout(): Promise<void> {
  await apiRequest('/api/auth/logout', { method: 'POST' })
  setAccessToken(null)
}

export async function deleteAccount(): Promise<void> {
  await apiRequest('/api/auth/me', { method: 'DELETE' })
  setAccessToken(null)
}

export async function fetchCurrentUser(): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>('/api/auth/me')
  return data.user
}
