import { describe, expect, it } from 'vitest'
import {
  calculateConsistencyPercent,
  calculateNutritionScore,
  NUTRITION_SCORE_POINTS,
} from './nutritionScore.js'

const baseInput = {
  caloriesConsumed: 2000,
  calorieTarget: 2000,
  proteinConsumedG: 150,
  proteinTargetG: 150,
  fibreConsumedG: 30,
  fibreTargetG: 30,
  waterConsumedMl: 2500,
  waterTargetMl: 2500,
  foodQualityPercent: 100,
  consistencyPercent: 100,
  mealTypesLoggedToday: 4,
}

describe('NUTRITION_SCORE_POINTS', () => {
  it('sums to 100', () => {
    const total = Object.values(NUTRITION_SCORE_POINTS).reduce((a, b) => a + b, 0)
    expect(total).toBe(100)
  })

  it('matches the spec exactly', () => {
    expect(NUTRITION_SCORE_POINTS).toEqual({
      calories: 30,
      protein: 25,
      fibre: 15,
      foodQuality: 10,
      consistency: 10,
      water: 5,
      loggingCompleteness: 5,
    })
  })
})

describe('calculateNutritionScore', () => {
  it('scores a perfect day at 100 / Excellent, with every component at max points', () => {
    const result = calculateNutritionScore(baseInput)
    expect(result.score).toBe(100)
    expect(result.label).toBe('Excellent')
    for (const [key, component] of Object.entries(result.components)) {
      expect(component.points).toBe(component.maxPoints)
      expect(component.maxPoints).toBe(NUTRITION_SCORE_POINTS[key as keyof typeof NUTRITION_SCORE_POINTS])
    }
  })

  it('the total is exactly the sum of the displayed points, not a separately rounded average', () => {
    const result = calculateNutritionScore({
      ...baseInput,
      caloriesConsumed: 1700, // < 100%
      foodQualityPercent: 82,
      consistencyPercent: 91,
    })
    const summed = Object.values(result.components).reduce((sum, c) => sum + c.points, 0)
    expect(result.score).toBe(summed)
  })

  it('penalizes eating far over or under target calories equally', () => {
    const over = calculateNutritionScore({ ...baseInput, caloriesConsumed: 2500 })
    const under = calculateNutritionScore({ ...baseInput, caloriesConsumed: 1500 })
    expect(over.components.calories.points).toBeLessThan(NUTRITION_SCORE_POINTS.calories)
    expect(over.components.calories.points).toBe(under.components.calories.points)
  })

  it('does not penalize exceeding protein/fibre/water targets', () => {
    const result = calculateNutritionScore({
      ...baseInput,
      proteinConsumedG: 300,
      fibreConsumedG: 60,
      waterConsumedMl: 5000,
    })
    expect(result.components.protein.points).toBe(NUTRITION_SCORE_POINTS.protein)
    expect(result.components.fibre.points).toBe(NUTRITION_SCORE_POINTS.fibre)
    expect(result.components.water.points).toBe(NUTRITION_SCORE_POINTS.water)
  })

  it('converts the AI food-quality percent straight to points out of 10', () => {
    const result = calculateNutritionScore({ ...baseInput, foodQualityPercent: 82 })
    expect(result.components.foodQuality.points).toBe(8) // round(82/100*10) = 8.2 -> 8
  })

  it('converts the rolling consistency percent straight to points out of 10', () => {
    const result = calculateNutritionScore({ ...baseInput, consistencyPercent: 91 })
    expect(result.components.consistency.points).toBe(9) // round(91/100*10) = 9.1 -> 9
  })

  it('matches the spec examples for logging completeness', () => {
    expect(calculateNutritionScore({ ...baseInput, mealTypesLoggedToday: 4 }).components.loggingCompleteness.points).toBe(5)
    expect(calculateNutritionScore({ ...baseInput, mealTypesLoggedToday: 1 }).components.loggingCompleteness.points).toBe(1)
    expect(calculateNutritionScore({ ...baseInput, mealTypesLoggedToday: 2 }).components.loggingCompleteness.points).toBe(3)
    expect(calculateNutritionScore({ ...baseInput, mealTypesLoggedToday: 0 }).components.loggingCompleteness.points).toBe(0)
  })

  it('maps scores to the correct label bands', () => {
    expect(calculateNutritionScore(baseInput).label).toBe('Excellent')
    expect(
      calculateNutritionScore({
        ...baseInput,
        caloriesConsumed: 2900,
        foodQualityPercent: 20,
        consistencyPercent: 20,
      }).label,
    ).not.toBe('Excellent')
  })
})

describe('calculateConsistencyPercent', () => {
  it('treats no history as neutral rather than penalizing a new user', () => {
    expect(calculateConsistencyPercent([])).toBe(100)
  })

  it('averages a perfect day at 100', () => {
    const result = calculateConsistencyPercent([
      {
        caloriesPercent: 100,
        proteinPercent: 100,
        fibrePercent: 100,
        mealsLoggedPercent: 100,
        foodQualityPercent: 100,
      },
    ])
    expect(result).toBe(100)
  })

  it('excludes a null food-quality day from that day\'s average rather than scoring it as 0', () => {
    const withNull = calculateConsistencyPercent([
      {
        caloriesPercent: 80,
        proteinPercent: 80,
        fibrePercent: 80,
        mealsLoggedPercent: 80,
        foodQualityPercent: null,
      },
    ])
    const withMatchingScore = calculateConsistencyPercent([
      {
        caloriesPercent: 80,
        proteinPercent: 80,
        fibrePercent: 80,
        mealsLoggedPercent: 80,
        foodQualityPercent: 80,
      },
    ])
    expect(withNull).toBe(80)
    expect(withMatchingScore).toBe(80)
  })

  it('one rough day only barely moves a mostly-consistent window', () => {
    const goodDay = {
      caloriesPercent: 95,
      proteinPercent: 95,
      fibrePercent: 95,
      mealsLoggedPercent: 100,
      foodQualityPercent: 90,
    }
    const roughDay = {
      caloriesPercent: 20,
      proteinPercent: 20,
      fibrePercent: 20,
      mealsLoggedPercent: 0,
      foodQualityPercent: 15,
    }
    const mostlyGood = calculateConsistencyPercent([
      goodDay,
      goodDay,
      goodDay,
      goodDay,
      goodDay,
      goodDay,
      roughDay,
    ])
    expect(mostlyGood).toBeGreaterThan(75)
  })
})
