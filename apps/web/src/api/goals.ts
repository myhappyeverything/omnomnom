import type { CreateGoalInput, GoalRecord } from '@purple/shared'
import { apiRequest } from './client'

export async function createGoal(input: CreateGoalInput): Promise<GoalRecord> {
  const data = await apiRequest<{ goal: GoalRecord }>('/api/goals', {
    method: 'POST',
    body: input,
  })
  return data.goal
}

export async function fetchActiveGoal(): Promise<GoalRecord | null> {
  try {
    const data = await apiRequest<{ goal: GoalRecord }>('/api/goals/active')
    return data.goal
  } catch {
    return null
  }
}
