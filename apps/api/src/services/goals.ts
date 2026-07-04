import type { CreateGoalInput, GoalRecord, UpdateGoalOverridesInput } from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import type { GoalRow } from '../types/models.js'
import { NotFoundError } from '../lib/errors.js'
import * as goalsRepo from '../repositories/goals.js'

export function toGoalRecord(row: GoalRow): GoalRecord {
  return {
    id: row.id,
    goalType: row.goal_type,
    startingWeightKg: row.starting_weight_kg,
    targetWeightKg: row.target_weight_kg,
    targetDuration: row.target_duration,
    customEndDate: row.custom_end_date,
    activityLevel: row.activity_level,
    bmr: row.bmr,
    tdee: row.tdee,
    calorieTarget: row.calorie_target,
    calorieTargetOverridden: row.calorie_target_overridden === 1,
    proteinTargetG: row.protein_target_g,
    proteinTargetOverridden: row.protein_target_overridden === 1,
    carbsTargetG: row.carbs_target_g,
    carbsTargetOverridden: row.carbs_target_overridden === 1,
    fatTargetG: row.fat_target_g,
    fatTargetOverridden: row.fat_target_overridden === 1,
    fibreTargetG: row.fibre_target_g,
    fibreTargetOverridden: row.fibre_target_overridden === 1,
    waterTargetMl: row.water_target_ml,
    waterTargetOverridden: row.water_target_overridden === 1,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getActiveGoal(env: Env, userId: string): Promise<GoalRecord | null> {
  const row = await goalsRepo.getActiveGoal(env, userId)
  return row ? toGoalRecord(row) : null
}

export async function listGoals(env: Env, userId: string): Promise<GoalRecord[]> {
  const rows = await goalsRepo.listGoals(env, userId)
  return rows.map(toGoalRecord)
}

export async function createGoal(
  env: Env,
  userId: string,
  input: CreateGoalInput,
): Promise<GoalRecord> {
  const row = await goalsRepo.createGoal(env, userId, input)
  return toGoalRecord(row)
}

export async function updateActiveGoalOverrides(
  env: Env,
  userId: string,
  overrides: UpdateGoalOverridesInput,
): Promise<GoalRecord> {
  const active = await goalsRepo.getActiveGoal(env, userId)
  if (!active) {
    throw new NotFoundError('No active goal to update')
  }
  const updated = await goalsRepo.updateGoalOverrides(env, userId, active.id, overrides)
  if (!updated) {
    throw new NotFoundError('Goal not found')
  }
  return toGoalRecord(updated)
}
