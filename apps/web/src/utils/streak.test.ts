import { describe, expect, it } from 'vitest'
import { computeWaterStreak, type DailyTotal } from './streak'

const TARGET_ML = 2500

function days(...totals: number[]): DailyTotal[] {
  // Most-recent-first, matching the documented contract (today at index 0).
  return totals.map((totalMl, i) => ({ dateKey: `day-${i}`, totalMl }))
}

describe('computeWaterStreak', () => {
  it('counts consecutive days meeting the target', () => {
    expect(computeWaterStreak(days(3000, 2600, 2500, 3500), TARGET_ML)).toBe(4)
  })

  it('stops counting at the first gap before today', () => {
    // today met, yesterday met, day before missed -> streak of 2
    expect(computeWaterStreak(days(3000, 2600, 1000, 3500), TARGET_ML)).toBe(2)
  })

  it('returns 0 when every day misses the target', () => {
    expect(computeWaterStreak(days(1000, 500, 1200), TARGET_ML)).toBe(0)
  })

  it('does not break an existing streak when today has not yet met the target', () => {
    // Today (index 0) is under target — the day isn't over yet, so it's
    // skipped rather than breaking the streak; prior days are still counted.
    expect(computeWaterStreak(days(500, 3000, 2600, 3500), TARGET_ML)).toBe(3)
  })

  it('does not count today toward the streak when today is under target', () => {
    // Only yesterday meets target, so streak should be 1, not include today's low total.
    expect(computeWaterStreak(days(0, 3000, 1000), TARGET_ML)).toBe(1)
  })

  it('returns 0 for an empty history', () => {
    expect(computeWaterStreak([], TARGET_ML)).toBe(0)
  })

  it('returns 0 when there is only one day and it is under target (today, not yet met)', () => {
    expect(computeWaterStreak(days(500), TARGET_ML)).toBe(0)
  })

  it('returns 1 when there is only one day and it meets target', () => {
    expect(computeWaterStreak(days(3000), TARGET_ML)).toBe(1)
  })

  it('treats exactly hitting the target as meeting it', () => {
    expect(computeWaterStreak(days(TARGET_ML, TARGET_ML), TARGET_ML)).toBe(2)
  })
})
