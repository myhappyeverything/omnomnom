export interface UserLocalTime {
  hours: number
  minutes: number
  /** YYYY-MM-DD in the user's own timezone — used as the dedupe key so a reminder fires once per local day. */
  dateKey: string
  /** 0 = Sunday .. 6 = Saturday, matching the days_of_week arrays stored for custom reminders. */
  dayOfWeek: number
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export function getUserLocalTime(timezone: string, now: Date = new Date()): UserLocalTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(now)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  // formatToParts renders midnight as "24" with hour12:false in some ICU builds — normalize it.
  const hours = Number(get('hour')) % 24
  const minutes = Number(get('minute'))
  const dateKey = `${get('year')}-${get('month')}-${get('day')}`
  const dayOfWeek = WEEKDAY_INDEX[get('weekday')] ?? 0

  return { hours, minutes, dateKey, dayOfWeek }
}

/** `target` is "HH:MM". True if `current` falls within `toleranceMinutes` of it (same local day). */
export function isTimeWithinTolerance(
  target: string,
  current: Pick<UserLocalTime, 'hours' | 'minutes'>,
  toleranceMinutes: number,
): boolean {
  const [targetHours, targetMinutes] = target.split(':').map(Number)
  const targetTotal = (targetHours ?? 0) * 60 + (targetMinutes ?? 0)
  const currentTotal = current.hours * 60 + current.minutes
  return Math.abs(currentTotal - targetTotal) < toleranceMinutes
}

/** Handles ranges that wrap past midnight, e.g. 22:00 -> 07:00. */
export function isWithinQuietHours(
  quietStart: string | null,
  quietEnd: string | null,
  current: Pick<UserLocalTime, 'hours' | 'minutes'>,
): boolean {
  if (!quietStart || !quietEnd) return false
  const [startHours, startMinutes] = quietStart.split(':').map(Number)
  const [endHours, endMinutes] = quietEnd.split(':').map(Number)
  const startTotal = (startHours ?? 0) * 60 + (startMinutes ?? 0)
  const endTotal = (endHours ?? 0) * 60 + (endMinutes ?? 0)
  const currentTotal = current.hours * 60 + current.minutes

  if (startTotal === endTotal) return false
  if (startTotal < endTotal) return currentTotal >= startTotal && currentTotal < endTotal
  return currentTotal >= startTotal || currentTotal < endTotal
}
