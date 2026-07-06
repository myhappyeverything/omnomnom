import type { NutritionScoreBreakdown } from '@omnomnom/shared'
import { apiRequest } from './client'

export interface DailyScoreSummary {
  dateKey: string
  score: number
  label: string
}

/** The worker has no meaningful local timezone of its own — this tells it which local day an ISO timestamp falls into. */
function tzOffsetMinutes(): string {
  return String(new Date().getTimezoneOffset())
}

export async function fetchNutritionScore(params: {
  date: string
  from: string
  to: string
}): Promise<NutritionScoreBreakdown> {
  const query = new URLSearchParams({
    date: params.date,
    from: params.from,
    to: params.to,
    tzOffsetMinutes: tzOffsetMinutes(),
  })
  return apiRequest<NutritionScoreBreakdown>(`/api/nutrition-score?${query.toString()}`)
}

export async function fetchNutritionScoreRange(params: {
  dateKeys: string[]
  from: string
  to: string
}): Promise<DailyScoreSummary[]> {
  const query = new URLSearchParams({
    dateKeys: params.dateKeys.join(','),
    from: params.from,
    to: params.to,
    tzOffsetMinutes: tzOffsetMinutes(),
  })
  const data = await apiRequest<{ days: DailyScoreSummary[] }>(
    `/api/nutrition-score/range?${query.toString()}`,
  )
  return data.days
}
