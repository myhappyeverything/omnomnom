import { useQuery } from '@tanstack/react-query'
import { getSettings } from '@/api/settings'

export const SETTINGS_QUERY_KEY = ['settings']

export function useSettings() {
  return useQuery({ queryKey: SETTINGS_QUERY_KEY, queryFn: getSettings })
}
