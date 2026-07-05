/** Local-day boundaries (not UTC) — a user's "today" is their own wall-clock day. */
export function getDayRange(date: Date = new Date()): { from: string; to: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  end.setMilliseconds(-1)
  return { from: start.toISOString(), to: end.toISOString() }
}

export function getLastNDaysRange(
  days: number,
  date: Date = new Date(),
): { from: string; to: string } {
  const { to } = getDayRange(date)
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  start.setDate(start.getDate() - (days - 1))
  return { from: start.toISOString(), to }
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Stable per-local-day grouping key, e.g. "2026-07-04" in the viewer's own timezone. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** The last `days` local-day keys, most recent (today) first. */
export function lastNDayKeys(days: number, date: Date = new Date()): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    d.setDate(d.getDate() - i)
    return localDateKey(d)
  })
}

/** A time-of-day greeting for the dashboard header. */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Whole years elapsed since a `YYYY-MM-DD` date of birth, as of today. */
export function calculateAge(dateOfBirth: string, today: Date = new Date()): number {
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}
