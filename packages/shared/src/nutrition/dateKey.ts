/** Stable per-local-day grouping key, e.g. "2026-07-04" in the caller's own clock/timezone. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Same idea as `localDateKey`, but for runtimes with no meaningful "local
 * timezone" of their own (a server) — shifts the instant by the minutes the
 * browser reported via `new Date().getTimezoneOffset()` before reading its
 * calendar fields, so an ISO timestamp buckets into the same day the user
 * would see on their own device.
 */
export function localDateKeyAtOffset(isoTimestamp: string, timezoneOffsetMinutes: number): string {
  const shifted = new Date(new Date(isoTimestamp).getTime() - timezoneOffsetMinutes * 60_000)
  const year = shifted.getUTCFullYear()
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const day = String(shifted.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Steps a "YYYY-MM-DD" key forward/back by whole days — pure calendar arithmetic, no timezone involved. */
export function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number) as [number, number, number]
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return localDateKey(date)
}
