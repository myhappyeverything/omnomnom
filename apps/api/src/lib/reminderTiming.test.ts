import { describe, expect, it } from 'vitest'
import { getUserLocalTime, isTimeWithinTolerance, isWithinQuietHours } from './reminderTiming.js'

describe('getUserLocalTime', () => {
  it('extracts the correct local time for a timezone ahead of UTC (Tokyo, UTC+9)', () => {
    // 2026-01-01T12:00:00Z -> 2026-01-01T21:00:00+09:00
    const result = getUserLocalTime('Asia/Tokyo', new Date('2026-01-01T12:00:00.000Z'))
    expect(result.hours).toBe(21)
    expect(result.minutes).toBe(0)
    expect(result.dateKey).toBe('2026-01-01')
  })

  it('extracts the correct local time for a timezone behind UTC (New York, UTC-5 in winter)', () => {
    // 2026-01-01T12:00:00Z -> 2026-01-01T07:00:00-05:00
    const result = getUserLocalTime('America/New_York', new Date('2026-01-01T12:00:00.000Z'))
    expect(result.hours).toBe(7)
    expect(result.minutes).toBe(0)
    expect(result.dateKey).toBe('2026-01-01')
  })

  it('rolls the date forward in Tokyo when UTC is still on the previous day', () => {
    // 2026-01-01T20:00:00Z -> 2026-01-02T05:00:00+09:00 (date rollover)
    const result = getUserLocalTime('Asia/Tokyo', new Date('2026-01-01T20:00:00.000Z'))
    expect(result.dateKey).toBe('2026-01-02')
    expect(result.hours).toBe(5)
    expect(result.dayOfWeek).toBe(5) // Friday
  })

  it('rolls the date backward in New York when UTC has already crossed midnight', () => {
    // 2026-01-02T02:00:00Z -> 2026-01-01T21:00:00-05:00 (previous local day)
    const result = getUserLocalTime('America/New_York', new Date('2026-01-02T02:00:00.000Z'))
    expect(result.dateKey).toBe('2026-01-01')
    expect(result.hours).toBe(21)
  })

  it('normalizes local midnight to hour 0 rather than 24', () => {
    // 2026-01-01T05:00:00Z -> 2026-01-01T00:00:00-05:00 exactly
    const result = getUserLocalTime('America/New_York', new Date('2026-01-01T05:00:00.000Z'))
    expect(result.hours).toBe(0)
    expect(result.minutes).toBe(0)
  })

  it('computes the correct day of week', () => {
    // 2026-01-01 is a Thursday.
    const result = getUserLocalTime('UTC', new Date('2026-01-01T12:00:00.000Z'))
    expect(result.dayOfWeek).toBe(4)
  })
})

describe('isTimeWithinTolerance', () => {
  it('matches an exact time match', () => {
    expect(isTimeWithinTolerance('08:00', { hours: 8, minutes: 0 }, 5)).toBe(true)
  })

  it('matches just inside the tolerance boundary', () => {
    // 08:04 is 4 minutes after 08:00; tolerance is 5 (exclusive strict <), so it matches.
    expect(isTimeWithinTolerance('08:00', { hours: 8, minutes: 4 }, 5)).toBe(true)
    expect(isTimeWithinTolerance('08:00', { hours: 7, minutes: 56 }, 5)).toBe(true)
  })

  it('excludes the exact tolerance boundary (strict less-than)', () => {
    // Exactly 5 minutes away with a 5-minute tolerance should NOT match.
    expect(isTimeWithinTolerance('08:00', { hours: 8, minutes: 5 }, 5)).toBe(false)
    expect(isTimeWithinTolerance('08:00', { hours: 7, minutes: 55 }, 5)).toBe(false)
  })

  it('rejects times outside the tolerance window', () => {
    expect(isTimeWithinTolerance('08:00', { hours: 8, minutes: 30 }, 5)).toBe(false)
    expect(isTimeWithinTolerance('08:00', { hours: 6, minutes: 0 }, 5)).toBe(false)
  })

  it('does not wrap across midnight', () => {
    // 23:58 vs target 00:00 is 1438 minutes apart in raw clock-minutes, not 2.
    expect(isTimeWithinTolerance('00:00', { hours: 23, minutes: 58 }, 5)).toBe(false)
  })
})

describe('isWithinQuietHours', () => {
  it('returns false when quiet hours are not configured', () => {
    expect(isWithinQuietHours(null, null, { hours: 23, minutes: 0 })).toBe(false)
    expect(isWithinQuietHours('22:00', null, { hours: 23, minutes: 0 })).toBe(false)
    expect(isWithinQuietHours(null, '07:00', { hours: 23, minutes: 0 })).toBe(false)
  })

  it('returns false when start equals end (treated as no quiet hours)', () => {
    expect(isWithinQuietHours('08:00', '08:00', { hours: 8, minutes: 0 })).toBe(false)
  })

  it('handles a same-day (non-wrapping) range correctly', () => {
    // 13:00 -> 14:00 nap-time style quiet hours.
    expect(isWithinQuietHours('13:00', '14:00', { hours: 13, minutes: 30 })).toBe(true)
    expect(isWithinQuietHours('13:00', '14:00', { hours: 12, minutes: 59 })).toBe(false)
    expect(isWithinQuietHours('13:00', '14:00', { hours: 14, minutes: 0 })).toBe(false)
  })

  describe('midnight-wraparound range (22:00 -> 07:00)', () => {
    it('is quiet right at the start boundary (inclusive)', () => {
      expect(isWithinQuietHours('22:00', '07:00', { hours: 22, minutes: 0 })).toBe(true)
    })

    it('is quiet just before the start boundary is false', () => {
      expect(isWithinQuietHours('22:00', '07:00', { hours: 21, minutes: 59 })).toBe(false)
    })

    it('is quiet through midnight', () => {
      expect(isWithinQuietHours('22:00', '07:00', { hours: 0, minutes: 0 })).toBe(true)
      expect(isWithinQuietHours('22:00', '07:00', { hours: 3, minutes: 30 })).toBe(true)
    })

    it('is quiet right up to (but excluding) the end boundary', () => {
      expect(isWithinQuietHours('22:00', '07:00', { hours: 6, minutes: 59 })).toBe(true)
    })

    it('is not quiet at or after the end boundary (exclusive)', () => {
      expect(isWithinQuietHours('22:00', '07:00', { hours: 7, minutes: 0 })).toBe(false)
      expect(isWithinQuietHours('22:00', '07:00', { hours: 7, minutes: 1 })).toBe(false)
    })

    it('is not quiet during the daytime gap', () => {
      expect(isWithinQuietHours('22:00', '07:00', { hours: 12, minutes: 0 })).toBe(false)
    })
  })
})
