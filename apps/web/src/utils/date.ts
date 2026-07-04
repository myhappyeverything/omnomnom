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
