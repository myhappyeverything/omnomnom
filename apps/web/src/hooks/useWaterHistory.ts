import { useQuery } from '@tanstack/react-query'
import { fetchActiveGoal } from '@/api/goals'
import { listWaterLogs, type OfflineWaterLogRecord } from '@/api/water'
import { getLastNDaysRange, lastNDayKeys, localDateKey } from '@/utils/date'
import { computeWaterStreak, type DailyTotal } from '@/utils/streak'

const HISTORY_DAYS = 14

export function useWaterHistory() {
  const range = getLastNDaysRange(HISTORY_DAYS)

  const goalQuery = useQuery({ queryKey: ['goals', 'active'], queryFn: fetchActiveGoal })
  // Typed as the wider offline-aware record: createWaterLog can inject an
  // optimistic `pending` entry straight into this query's cache before the
  // server has ever seen it (see WaterPage's addMutation.onSuccess).
  const logsQuery = useQuery<OfflineWaterLogRecord[]>({
    queryKey: ['water', 'history', range.from],
    queryFn: () => listWaterLogs(range),
  })

  const isLoading = goalQuery.isLoading || logsQuery.isLoading
  const goal = goalQuery.data ?? null
  const logs = logsQuery.data ?? []

  const totalsByDay = new Map<string, number>()
  for (const log of logs) {
    const key = localDateKey(new Date(log.loggedAt))
    totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + log.amountMl)
  }

  const dailyTotals: DailyTotal[] = lastNDayKeys(HISTORY_DAYS).map((dateKey) => ({
    dateKey,
    totalMl: totalsByDay.get(dateKey) ?? 0,
  }))

  const todayTotalMl = dailyTotals[0]?.totalMl ?? 0
  const targetMl = goal?.waterTargetMl ?? 0
  const streak = computeWaterStreak(dailyTotals, targetMl)

  const todayLogs = logs
    .filter((log) => localDateKey(new Date(log.loggedAt)) === dailyTotals[0]?.dateKey)
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())

  return { isLoading, targetMl, todayTotalMl, dailyTotals, streak, todayLogs }
}
