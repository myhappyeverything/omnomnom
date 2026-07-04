import { describe, expect, it } from 'vitest'
import { displayWeight, kgToLbs, lbsToKg, toStoredKg, weightUnitLabel } from './units'

describe('kgToLbs / lbsToKg', () => {
  it('round-trips a value through kg -> lbs -> kg', () => {
    const originalKg = 82.5
    const roundTripped = lbsToKg(kgToLbs(originalKg))
    expect(roundTripped).toBeCloseTo(originalKg, 10)
  })

  it('converts a known reference value', () => {
    expect(kgToLbs(1)).toBeCloseTo(2.20462262, 6)
    expect(lbsToKg(1)).toBeCloseTo(0.45359237, 8)
  })
})

describe('displayWeight', () => {
  it('is a no-op pass-through for metric', () => {
    expect(displayWeight(75, 'metric')).toBe(75)
  })

  it('converts kg to lbs for imperial', () => {
    expect(displayWeight(1, 'imperial')).toBeCloseTo(2.20462262, 6)
  })
})

describe('toStoredKg', () => {
  it('is a no-op pass-through for metric', () => {
    expect(toStoredKg(75, 'metric')).toBe(75)
  })

  it('converts lbs to kg for imperial', () => {
    expect(toStoredKg(1, 'imperial')).toBeCloseTo(0.45359237, 8)
  })

  it('round-trips through displayWeight for both unit systems', () => {
    for (const unitSystem of ['metric', 'imperial'] as const) {
      const storedKg = 68.3
      const displayed = displayWeight(storedKg, unitSystem)
      expect(toStoredKg(displayed, unitSystem)).toBeCloseTo(storedKg, 10)
    }
  })
})

describe('weightUnitLabel', () => {
  it('labels metric as kg and imperial as lb', () => {
    expect(weightUnitLabel('metric')).toBe('kg')
    expect(weightUnitLabel('imperial')).toBe('lb')
  })
})
