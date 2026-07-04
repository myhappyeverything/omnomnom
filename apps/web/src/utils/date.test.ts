import { describe, expect, it } from 'vitest'
import { getLastNDaysRange, isSameLocalDay, lastNDayKeys, localDateKey } from './date'

describe('localDateKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(localDateKey(new Date(2026, 6, 4))).toBe('2026-07-04')
  })

  it('pads single-digit months and days', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('isSameLocalDay', () => {
  it('treats different times on the same local day as equal', () => {
    expect(isSameLocalDay(new Date(2026, 6, 4, 0, 1), new Date(2026, 6, 4, 23, 59))).toBe(true)
  })

  it('treats different days as not equal', () => {
    expect(isSameLocalDay(new Date(2026, 6, 4), new Date(2026, 6, 5))).toBe(false)
  })
})

describe('lastNDayKeys', () => {
  it('returns exactly N distinct consecutive date keys ending today, most recent first', () => {
    const today = new Date(2026, 6, 4)
    const keys = lastNDayKeys(14, today)

    expect(keys).toHaveLength(14)
    expect(new Set(keys).size).toBe(14)
    expect(keys[0]).toBe('2026-07-04')
    expect(keys.at(-1)).toBe('2026-06-21')
  })

  it('produces keys in strictly descending consecutive order', () => {
    const keys = lastNDayKeys(5, new Date(2026, 6, 4))
    expect(keys).toEqual(['2026-07-04', '2026-07-03', '2026-07-02', '2026-07-01', '2026-06-30'])
  })

  it('handles month/year boundaries correctly', () => {
    const keys = lastNDayKeys(3, new Date(2026, 0, 1))
    expect(keys).toEqual(['2026-01-01', '2025-12-31', '2025-12-30'])
  })
})

describe('getLastNDaysRange', () => {
  it('spans exactly N local days from start to end', () => {
    const today = new Date(2026, 6, 4, 15, 30)
    const { from, to } = getLastNDaysRange(7, today)

    const fromDate = new Date(from)
    const toDate = new Date(to)

    expect(localDateKey(fromDate)).toBe('2026-06-28')
    expect(localDateKey(toDate)).toBe('2026-07-04')
    // `to` is the last millisecond of today; `from` is the first moment of the start day.
    expect(toDate.getHours()).toBe(23)
    expect(toDate.getMinutes()).toBe(59)
    expect(fromDate.getHours()).toBe(0)
    expect(fromDate.getMinutes()).toBe(0)
  })

  it('returns a single-day range when days = 1', () => {
    const today = new Date(2026, 6, 4, 15, 30)
    const { from, to } = getLastNDaysRange(1, today)
    expect(localDateKey(new Date(from))).toBe(localDateKey(new Date(to)))
    expect(localDateKey(new Date(from))).toBe('2026-07-04')
  })
})
