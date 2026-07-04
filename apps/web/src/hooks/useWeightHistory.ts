import { useQuery } from '@tanstack/react-query'
import { fetchActiveGoal } from '@/api/goals'
import { listWeightLogs, type OfflineWeightLogRecord } from '@/api/weight'
import { getLastNDaysRange } from '@/utils/date'

const MAX_RANGE_DAYS = 365

export function useWeightHistory() {
  const range = getLastNDaysRange(MAX_RANGE_DAYS)

  const goalQuery = useQuery({ queryKey: ['goals', 'active'], queryFn: fetchActiveGoal })
  // Typed as the wider offline-aware record: createWeightLog can inject an
  // optimistic `pending` entry straight into this query's cache before the
  // server has ever seen it (see LogWeightDialog's onSuccess).
  const logsQuery = useQuery<OfflineWeightLogRecord[]>({
    queryKey: ['weight', 'history', range.from],
    queryFn: () => listWeightLogs(range),
  })

  const logs = [...(logsQuery.data ?? [])].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
  )

  return {
    isLoading: goalQuery.isLoading || logsQuery.isLoading,
    goal: goalQuery.data ?? null,
    logs,
  }
}
