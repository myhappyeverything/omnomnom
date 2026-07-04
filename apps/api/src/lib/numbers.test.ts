import { describe, expect, it } from 'vitest'
import { round2 } from './numbers.js'

describe('round2', () => {
  it('rounds to two decimal places', () => {
    expect(round2(1.005)).toBe(1)
    expect(round2(1.234)).toBe(1.23)
    expect(round2(1.235)).toBe(1.24)
  })

  it('cleans up floating point rounding artifacts', () => {
    // 1.005 * 100 is actually 100.49999999999999 in IEEE 754, so a naive
    // Math.round(value * 100) / 100 without care could misfire; verify the
    // classic artifact-prone inputs behave sanely.
    expect(round2(0.1 + 0.2)).toBe(0.3)
    expect(round2(1.1 + 2.2)).toBe(3.3)
  })

  it('leaves whole numbers and already-short decimals unchanged', () => {
    expect(round2(5)).toBe(5)
    expect(round2(5.1)).toBe(5.1)
    expect(round2(0)).toBe(0)
  })

  it('handles negative numbers', () => {
    expect(round2(-1.005)).toBe(-1)
    expect(round2(-1.236)).toBe(-1.24)
  })
})
