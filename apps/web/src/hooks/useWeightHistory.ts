import { useQuery } from '@tanstack/react-query'
import { fetchActiveGoal } from '@/api/goals'
import { listWeightLogs } from '@/api/weight'
import { getLastNDaysRange } from '@/utils/date'

const MAX_RANGE_DAYS = 365

export function useWeightHistory() {
  const range = getLastNDaysRange(MAX_RANGE_DAYS)

  const goalQuery = useQuery({ queryKey: ['goals', 'active'], queryFn: fetchActiveGoal })
  const logsQuery = useQuery({
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
