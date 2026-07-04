import { describe, expect, it } from 'vitest'
import { calculateWeightTrend, estimateGoalDate, type WeightPoint } from './weightTrend'

describe('calculateWeightTrend', () => {
  it('returns null with fewer than 2 logs', () => {
    expect(calculateWeightTrend([])).toBeNull()
    expect(
      calculateWeightTrend([{ loggedAt: '2026-01-01T00:00:00.000Z', weightKg: 90 }]),
    ).toBeNull()
  })

  it('computes a negative kg/week rate for a downward-trending series', () => {
    // Loses 1.4kg over 14 days -> -0.7 kg/week.
    const logs: WeightPoint[] = [
      { loggedAt: '2026-01-01T00:00:00.000Z', weightKg: 90 },
      { loggedAt: '2026-01-08T00:00:00.000Z', weightKg: 89.3 },
      { loggedAt: '2026-01-15T00:00:00.000Z', weightKg: 88.6 },
    ]
    const trend = calculateWeightTrend(logs)
    expect(trend).not.toBeNull()
    expect(trend!).toBeLessThan(0)
    expect(trend!).toBeCloseTo(-0.7, 5)
  })

  it('is order-independent — sorts logs by loggedAt before computing the slope', () => {
    const logs: WeightPoint[] = [
      { loggedAt: '2026-01-15T00:00:00.000Z', weightKg: 88.6 },
      { loggedAt: '2026-01-01T00:00:00.000Z', weightKg: 90 },
      { loggedAt: '2026-01-08T00:00:00.000Z', weightKg: 89.3 },
    ]
    expect(calculateWeightTrend(logs)).toBeCloseTo(-0.7, 5)
  })

  it('computes a positive kg/week rate for an upward-trending series', () => {
    const logs: WeightPoint[] = [
      { loggedAt: '2026-01-01T00:00:00.000Z', weightKg: 70 },
      { loggedAt: '2026-01-15T00:00:00.000Z', weightKg: 71.4 },
    ]
    const trend = calculateWeightTrend(logs)
    expect(trend!).toBeGreaterThan(0)
    expect(trend!).toBeCloseTo(0.7, 5)
  })

  it('returns null when both logs share the same timestamp (zero day span)', () => {
    const logs: WeightPoint[] = [
      { loggedAt: '2026-01-01T00:00:00.000Z', weightKg: 90 },
      { loggedAt: '2026-01-01T00:00:00.000Z', weightKg: 88 },
    ]
    expect(calculateWeightTrend(logs)).toBeNull()
  })
})

describe('estimateGoalDate', () => {
  it('returns today when already effectively at goal', () => {
    const result = estimateGoalDate(80, 80.02, 0.5)
    expect(result).not.toBeNull()
    const now = new Date()
    expect(result!.toDateString()).toBe(now.toDateString())
  })

  it('returns null when there is no trend data', () => {
    expect(estimateGoalDate(90, 80, null)).toBeNull()
  })

  it('returns null when the trend is flat (zero)', () => {
    expect(estimateGoalDate(90, 80, 0)).toBeNull()
  })

  it('returns null when the trend moves the wrong way relative to the goal', () => {
    // Needs to lose weight (target < current) but trending upward.
    expect(estimateGoalDate(90, 80, 0.5)).toBeNull()
    // Needs to gain weight (target > current) but trending downward.
    expect(estimateGoalDate(70, 80, -0.5)).toBeNull()
  })

  it('projects a future date forward when the trend matches the goal direction', () => {
    // Needs to lose 10kg, trending down at 1kg/week -> ~10 weeks (70 days) out.
    const result = estimateGoalDate(90, 80, -1)
    expect(result).not.toBeNull()

    const expected = new Date()
    expected.setDate(expected.getDate() + 70)
    expect(result!.toDateString()).toBe(expected.toDateString())
  })

  it('projects forward correctly for a weight-gain goal', () => {
    // Needs to gain 5kg, trending up at 0.5kg/week -> 10 weeks (70 days) out.
    const result = estimateGoalDate(70, 75, 0.5)
    expect(result).not.toBeNull()

    const expected = new Date()
    expected.setDate(expected.getDate() + 70)
    expect(result!.toDateString()).toBe(expected.toDateString())
  })
})
