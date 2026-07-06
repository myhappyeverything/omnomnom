import type { IssuedWidgetToken, PublicWidgetToken } from '@omnomnom/shared'
import { apiRequest } from './client'

export const WIDGET_TOKENS_QUERY_KEY = ['widget-tokens']

export async function listWidgetTokens(): Promise<PublicWidgetToken[]> {
  const data = await apiRequest<{ tokens: PublicWidgetToken[] }>('/api/widget-tokens')
  return data.tokens
}

export async function createWidgetToken(label: string): Promise<IssuedWidgetToken> {
  return apiRequest<IssuedWidgetToken>('/api/widget-tokens', { method: 'POST', body: { label } })
}

export async function revokeWidgetToken(id: string): Promise<void> {
  await apiRequest(`/api/widget-tokens/${id}`, { method: 'DELETE' })
}
