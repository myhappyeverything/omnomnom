import type { CreateGoalInput, UpdateGoalOverridesInput } from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import type { GoalRow } from '../types/models.js'
import { newId, nowIso } from '../lib/db.js'

export async function getActiveGoal(env: Env, userId: string): Promise<GoalRow | null> {
  return env.DB.prepare('SELECT * FROM goals WHERE user_id = ? AND is_active = 1')
    .bind(userId)
    .first<GoalRow>()
}

export async function getGoalById(
  env: Env,
  userId: string,
  goalId: string,
): Promise<GoalRow | null> {
  return env.DB.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?')
    .bind(goalId, userId)
    .first<GoalRow>()
}

export async function listGoals(env: Env, userId: string): Promise<GoalRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
  )
    .bind(userId)
    .all<GoalRow>()
  return results
}

export async function createGoal(
  env: Env,
  userId: string,
  input: CreateGoalInput,
): Promise<GoalRow> {
  const id = newId()
  const timestamp = nowIso()

  const statements = [
    env.DB.prepare(
      'UPDATE goals SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1',
    ).bind(timestamp, userId),
    env.DB.prepare(
      `INSERT INTO goals (
        id, user_id, goal_type, starting_weight_kg, target_weight_kg, target_duration, custom_end_date,
        activity_level, bmr, tdee,
        calorie_target, calorie_target_overridden,
        protein_target_g, protein_target_overridden,
        carbs_target_g, carbs_target_overridden,
        fat_target_g, fat_target_overridden,
        fibre_target_g, fibre_target_overridden,
        water_target_ml, water_target_overridden,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).bind(
      id,
      userId,
      input.goalType,
      input.startingWeightKg,
      input.targetWeightKg,
      input.targetDuration,
      input.customEndDate ?? null,
      input.activityLevel,
      input.bmr,
      input.tdee,
      input.calorieTarget,
      input.calorieTargetOverridden ? 1 : 0,
      input.proteinTargetG,
      input.proteinTargetOverridden ? 1 : 0,
      input.carbsTargetG,
      input.carbsTargetOverridden ? 1 : 0,
      input.fatTargetG,
      input.fatTargetOverridden ? 1 : 0,
      input.fibreTargetG,
      input.fibreTargetOverridden ? 1 : 0,
      input.waterTargetMl,
      input.waterTargetOverridden ? 1 : 0,
      timestamp,
      timestamp,
    ),
  ]

  await env.DB.batch(statements)
  const goal = await getGoalById(env, userId, id)
  if (!goal) throw new Error('Failed to create goal')
  return goal
}

const OVERRIDE_FIELD_MAP: Record<
  keyof UpdateGoalOverridesInput,
  { valueColumn: string; overriddenColumn: string }
> = {
  calorieTarget: { valueColumn: 'calorie_target', overriddenColumn: 'calorie_target_overridden' },
  proteinTargetG: {
    valueColumn: 'protein_target_g',
    overriddenColumn: 'protein_target_overridden',
  },
  carbsTargetG: { valueColumn: 'carbs_target_g', overriddenColumn: 'carbs_target_overridden' },
  fatTargetG: { valueColumn: 'fat_target_g', overriddenColumn: 'fat_target_overridden' },
  fibreTargetG: { valueColumn: 'fibre_target_g', overriddenColumn: 'fibre_target_overridden' },
  waterTargetMl: { valueColumn: 'water_target_ml', overriddenColumn: 'water_target_overridden' },
}

export async function updateGoalOverrides(
  env: Env,
  userId: string,
  goalId: string,
  overrides: UpdateGoalOverridesInput,
): Promise<GoalRow | null> {
  const entries = Object.entries(overrides) as [
    keyof UpdateGoalOverridesInput,
    number | undefined,
  ][]
  const setClauses: string[] = []
  const values: (string | number)[] = []

  for (const [key, value] of entries) {
    if (value === undefined) continue
    const columns = OVERRIDE_FIELD_MAP[key]
    setClauses.push(`${columns.valueColumn} = ?`, `${columns.overriddenColumn} = 1`)
    values.push(value)
  }

  if (setClauses.length === 0) {
    return getGoalById(env, userId, goalId)
  }

  setClauses.push('updated_at = ?')
  values.push(nowIso())
  values.push(goalId, userId)

  await env.DB.prepare(`UPDATE goals SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...values)
    .run()

  return getGoalById(env, userId, goalId)
}
