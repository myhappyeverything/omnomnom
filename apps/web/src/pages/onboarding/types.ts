import type { ActivityLevel, Goal, RegisterInput, TargetDuration } from '@purple/shared'

export interface OnboardingAccountData extends RegisterInput {
  currentWeightKg: number
}

export interface OnboardingGoalData {
  goalType: Goal
  targetWeightKg: number
  targetDuration: TargetDuration
  customEndDate?: string
  activityLevel: ActivityLevel
}
