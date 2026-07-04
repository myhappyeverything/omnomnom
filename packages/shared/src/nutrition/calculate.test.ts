import { describe, expect, it } from 'vitest'
import {
  calculateBMI,
  calculateBMR,
  calculateCalorieTarget,
  calculateGoalPlan,
  calculateHealthyBmiRange,
  calculateMacroTargets,
  calculateTDEE,
  calculateWaterTargetMl,
  getDurationDays,
} from './calculate.js'

describe('calculateBMR (Mifflin-St Jeor)', () => {
  it('computes for a male', () => {
    expect(calculateBMR({ weightKg: 80, heightCm: 180, age: 30, sex: 'male' })).toBe(1780)
  })

  it('computes for a female', () => {
    expect(calculateBMR({ weightKg: 60, heightCm: 165, age: 30, sex: 'female' })).toBe(1320)
  })
})

describe('calculateTDEE', () => {
  it('applies the activity multiplier', () => {
    expect(calculateTDEE(1780, 'moderately_active')).toBe(2759)
    expect(calculateTDEE(1780, 'sedentary')).toBe(Math.round(1780 * 1.2))
  })
})

describe('getDurationDays', () => {
  it('converts fixed durations to days', () => {
    expect(getDurationDays('2_weeks')).toBe(14)
    expect(getDurationDays('12_weeks')).toBe(84)
  })

  it('requires a customEndDate for custom durations', () => {
    expect(() => getDurationDays('custom')).toThrow()
  })
})

describe('calculateCalorieTarget', () => {
  it('returns TDEE unchanged for maintenance', () => {
    expect(
      calculateCalorieTarget({
        tdee: 2500,
        goalType: 'maintain',
        currentWeightKg: 80,
        targetWeightKg: 80,
        totalDays: 84,
      }),
    ).toBe(2500)
  })

  it('creates a deficit for weight loss, capped at a safe rate', () => {
    const result = calculateCalorieTarget({
      tdee: 2759,
      goalType: 'lose_weight',
      currentWeightKg: 90,
      targetWeightKg: 80,
      totalDays: 84,
    })
    expect(result).toBe(1842)
    expect(result).toBeLessThan(2759)
  })

  it('never drops below the absolute minimum calorie floor', () => {
    const result = calculateCalorieTarget({
      tdee: 1400,
      goalType: 'lose_weight',
      currentWeightKg: 100,
      targetWeightKg: 60,
      totalDays: 14, // aggressive: would compute a huge deficit without clamping
    })
    expect(result).toBeGreaterThanOrEqual(1200)
  })

  it('creates a surplus for weight gain, capped at a lean-gain rate', () => {
    const result = calculateCalorieTarget({
      tdee: 2500,
      goalType: 'gain_weight',
      currentWeightKg: 70,
      targetWeightKg: 75,
      totalDays: 84,
    })
    expect(result).toBeGreaterThan(2500)
    expect(result).toBeLessThanOrEqual(2500 + 500)
  })
})

describe('calculateMacroTargets', () => {
  it('produces macros that reconstruct close to the calorie target', () => {
    const macros = calculateMacroTargets({
      calorieTarget: 1842,
      currentWeightKg: 90,
      goalType: 'lose_weight',
    })
    expect(macros.proteinG).toBe(198)
    expect(macros.fatG).toBe(61)
    expect(macros.carbsG).toBe(125)
    expect(macros.fibreG).toBe(26)

    const reconstructed = macros.proteinG * 4 + macros.fatG * 9 + macros.carbsG * 4
    expect(Math.abs(reconstructed - 1842)).toBeLessThan(20)
  })

  it('never lets carbs or fat collapse below their safety floors on a very low calorie target', () => {
    const macros = calculateMacroTargets({
      calorieTarget: 1200,
      currentWeightKg: 110,
      goalType: 'lose_weight',
    })
    expect(macros.carbsG).toBeGreaterThanOrEqual(50)
    expect(macros.fatG).toBeGreaterThanOrEqual(20)
  })
})

describe('calculateWaterTargetMl', () => {
  it('scales with body weight and stays within sane bounds', () => {
    expect(calculateWaterTargetMl(90)).toBe(3150)
    expect(calculateWaterTargetMl(30)).toBeGreaterThanOrEqual(1500)
    expect(calculateWaterTargetMl(200)).toBeLessThanOrEqual(4000)
  })
})

describe('calculateBMI / calculateHealthyBmiRange', () => {
  it('computes BMI', () => {
    expect(calculateBMI(90, 180)).toBe(27.8)
  })

  it('computes a healthy weight range for a given height', () => {
    const range = calculateHealthyBmiRange(180)
    expect(range.minKg).toBeCloseTo(59.9, 1)
    expect(range.maxKg).toBeCloseTo(80.7, 1)
  })
})

describe('calculateGoalPlan', () => {
  it('composes the full plan consistently for a weight-loss goal', () => {
    const plan = calculateGoalPlan({
      sex: 'male',
      dateOfBirth: '1994-01-01',
      heightCm: 180,
      currentWeightKg: 90,
      targetWeightKg: 80,
      goalType: 'lose_weight',
      activityLevel: 'moderately_active',
      targetDuration: '12_weeks',
    })

    expect(plan.calorieTarget).toBeLessThan(plan.tdee)
    expect(plan.tdee).toBeGreaterThan(plan.bmr)
    expect(plan.proteinTargetG).toBeGreaterThan(0)
    expect(plan.waterTargetMl).toBeGreaterThanOrEqual(1500)
  })
})
