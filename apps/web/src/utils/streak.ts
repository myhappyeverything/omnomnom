export interface DailyTotal {
  dateKey: string
  totalMl: number
}

/**
 * `dailyTotals` must be sorted most-recent-first (today at index 0). Today is
 * exempt from breaking the streak — the day isn't over yet — but every day
 * before it must meet the target for the streak to keep counting.
 */
export function computeWaterStreak(dailyTotals: DailyTotal[], targetMl: number): number {
  let streak = 0
  for (let i = 0; i < dailyTotals.length; i++) {
    const { totalMl } = dailyTotals[i]!
    if (i === 0 && totalMl < targetMl) continue
    if (totalMl >= targetMl) streak++
    else break
  }
  return streak
}
