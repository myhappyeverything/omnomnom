import { describe, expect, it } from 'vitest'
import { calculateNutritionScore, DEFAULT_NUTRITION_SCORE_WEIGHTS } from './nutritionScore.js'

// scoreMealTiming buckets by the JS Date's *local* hour (correct for a real user
// in their own timezone). Built with the local Date constructor rather than
// hardcoded UTC strings so these tests pass regardless of the runner's TZ.
const localHourIso = (hour: number) => new Date(2026, 0, 1, hour).toISOString()

const baseInput = {
  caloriesConsumed: 2000,
  calorieTarget: 2000,
  proteinConsumedG: 150,
  proteinTargetG: 150,
  fibreConsumedG: 30,
  fibreTargetG: 30,
  waterConsumedMl: 2500,
  waterTargetMl: 2500,
  daysLoggedInLastWeek: 7,
  mealTimestamps: [localHourIso(8), localHourIso(13), localHourIso(19)],
  goalType: 'maintain' as const,
  weightTrendKgPerWeek: 0,
}

describe('DEFAULT_NUTRITION_SCORE_WEIGHTS', () => {
  it('matches the spec exactly and sums to 1', () => {
    expect(DEFAULT_NUTRITION_SCORE_WEIGHTS).toEqual({
      calories: 0.3,
      protein: 0.25,
      fibre: 0.15,
      water: 0.1,
      consistency: 0.1,
      mealTiming: 0.05,
      weightTrend: 0.05,
    })
    const total = Object.values(DEFAULT_NUTRITION_SCORE_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 10)
  })
})

describe('calculateNutritionScore', () => {
  it('scores a perfect day at 100 / Excellent', () => {
    const result = calculateNutritionScore(baseInput)
    expect(result.score).toBe(100)
    expect(result.label).toBe('Excellent')
  })

  it('every component contribution respects its configured weight', () => {
    const result = calculateNutritionScore(baseInput)
    for (const component of Object.values(result.components)) {
      expect(component.contribution).toBeCloseTo(component.score * component.weight, 5)
    }
  })

  it('penalizes eating far over target calories', () => {
    const result = calculateNutritionScore({ ...baseInput, caloriesConsumed: 3000 })
    expect(result.components.calories.score).toBeLessThan(100)
    expect(result.score).toBeLessThan(100)
  })

  it('penalizes eating far under target calories the same as far over', () => {
    const over = calculateNutritionScore({ ...baseInput, caloriesConsumed: 2500 })
    const under = calculateNutritionScore({ ...baseInput, caloriesConsumed: 1500 })
    expect(over.components.calories.score).toBe(under.components.calories.score)
  })

  it('does not penalize exceeding protein/fibre/water targets', () => {
    const result = calculateNutritionScore({
      ...baseInput,
      proteinConsumedG: 300,
      fibreConsumedG: 60,
      waterConsumedMl: 5000,
    })
    expect(result.components.protein.score).toBe(100)
    expect(result.components.fibre.score).toBe(100)
    expect(result.components.water.score).toBe(100)
  })

  it('scores consistency proportionally to days logged this week', () => {
    const result = calculateNutritionScore({ ...baseInput, daysLoggedInLastWeek: 3.5 })
    expect(result.components.consistency.score).toBe(50)
  })

  it('rewards spreading meals across the day over clustering them', () => {
    const spread = calculateNutritionScore(baseInput) // morning, midday, evening
    const clustered = calculateNutritionScore({
      ...baseInput,
      mealTimestamps: [localHourIso(19), localHourIso(19), localHourIso(19)],
    })
    expect(spread.components.mealTiming.score).toBeGreaterThan(
      clustered.components.mealTiming.score,
    )
  })

  it('gives no meal-timing credit when nothing has been logged yet today', () => {
    const result = calculateNutritionScore({ ...baseInput, mealTimestamps: [] })
    expect(result.components.mealTiming.score).toBe(0)
  })

  it('treats missing weight-trend data as neutral rather than penalizing it', () => {
    const result = calculateNutritionScore({ ...baseInput, weightTrendKgPerWeek: null })
    expect(result.components.weightTrend.score).toBe(100)
  })

  it('rewards a lose_weight goal for a downward trend and penalizes an upward one', () => {
    const losing = calculateNutritionScore({
      ...baseInput,
      goalType: 'lose_weight',
      weightTrendKgPerWeek: -0.5,
    })
    const gaining = calculateNutritionScore({
      ...baseInput,
      goalType: 'lose_weight',
      weightTrendKgPerWeek: 0.5,
    })
    expect(losing.components.weightTrend.score).toBe(100)
    expect(gaining.components.weightTrend.score).toBeLessThan(100)
  })

  it('rewards a gain_weight goal for an upward trend and penalizes a downward one', () => {
    const gaining = calculateNutritionScore({
      ...baseInput,
      goalType: 'gain_weight',
      weightTrendKgPerWeek: 0.3,
    })
    const losing = calculateNutritionScore({
      ...baseInput,
      goalType: 'gain_weight',
      weightTrendKgPerWeek: -0.3,
    })
    expect(gaining.components.weightTrend.score).toBe(100)
    expect(losing.components.weightTrend.score).toBeLessThan(100)
  })

  it('accepts custom weights without changing the underlying component scores', () => {
    const customWeights = { ...DEFAULT_NUTRITION_SCORE_WEIGHTS, calories: 0.5, protein: 0.05 }
    const result = calculateNutritionScore(baseInput, customWeights)
    expect(result.components.calories.weight).toBe(0.5)
    expect(result.components.calories.score).toBe(100)
  })

  it('maps scores to the correct label bands', () => {
    expect(calculateNutritionScore(baseInput).label).toBe('Excellent')
    expect(
      calculateNutritionScore({ ...baseInput, caloriesConsumed: 2900, daysLoggedInLastWeek: 3 })
        .label,
    ).not.toBe('Excellent')
  })
})
