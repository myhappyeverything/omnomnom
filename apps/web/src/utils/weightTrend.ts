export interface WeightPoint {
  loggedAt: string
  weightKg: number
}

/** Simple slope between the oldest and newest log in the given set, normalized to kg/week. */
export function calculateWeightTrend(logs: WeightPoint[]): number | null {
  if (logs.length < 2) return null
  const sorted = [...logs].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
  )
  const first = sorted[0]!
  const last = sorted.at(-1)!
  const daysSpan =
    (new Date(last.loggedAt).getTime() - new Date(first.loggedAt).getTime()) / 86_400_000
  if (daysSpan <= 0) return null
  return ((last.weightKg - first.weightKg) / daysSpan) * 7
}

/**
 * Change between the current weight and the closest log at or before
 * `days` ago — null when history doesn't reach back that far yet, so the
 * UI can show "not enough data" instead of a misleadingly small number.
 */
export function calculateWeightChangeOverDays(logs: WeightPoint[], days: number): number | null {
  if (logs.length === 0) return null
  const sorted = [...logs].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
  )
  const current = sorted.at(-1)!
  const cutoff = new Date(current.loggedAt).getTime() - days * 86_400_000
  const baseline = [...sorted].reverse().find((log) => new Date(log.loggedAt).getTime() <= cutoff)
  if (!baseline) return null
  return current.weightKg - baseline.weightKg
}

/**
 * Projects forward at the current trend rate. Returns null when there's no
 * trend, the user is already at goal, or the trend is heading the wrong way —
 * showing a fabricated date in those cases would be actively misleading.
 */
export function estimateGoalDate(
  currentWeightKg: number,
  targetWeightKg: number,
  trendKgPerWeek: number | null,
): Date | null {
  const remainingKg = targetWeightKg - currentWeightKg
  if (Math.abs(remainingKg) < 0.05) return new Date()
  if (!trendKgPerWeek || Math.sign(remainingKg) !== Math.sign(trendKgPerWeek)) return null

  const weeksRemaining = remainingKg / trendKgPerWeek
  const date = new Date()
  date.setDate(date.getDate() + Math.round(weeksRemaining * 7))
  return date
}
