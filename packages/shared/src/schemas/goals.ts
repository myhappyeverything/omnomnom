import { z } from 'zod'
import { ACTIVITY_LEVEL_VALUES, GOAL_VALUES, TARGET_DURATION_VALUES } from '../constants.js'

const positiveNumber = z.number().positive()
const nonNegativeNumber = z.number().min(0)

/**
 * The frontend's calculation engine (Stage 11) computes BMR/TDEE/targets and
 * lets the user override any of them before submitting — so by the time this
 * reaches the API, every target is a concrete, already-decided number. The
 * API's job is to validate and persist it, not to re-derive it.
 */
export const createGoalSchema = z
  .object({
    goalType: z.enum(GOAL_VALUES),
    startingWeightKg: positiveNumber,
    targetWeightKg: positiveNumber,
    targetDuration: z.enum(TARGET_DURATION_VALUES),
    customEndDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    activityLevel: z.enum(ACTIVITY_LEVEL_VALUES),
    bmr: positiveNumber,
    tdee: positiveNumber,
    calorieTarget: positiveNumber,
    calorieTargetOverridden: z.boolean().default(false),
    proteinTargetG: nonNegativeNumber,
    proteinTargetOverridden: z.boolean().default(false),
    carbsTargetG: nonNegativeNumber,
    carbsTargetOverridden: z.boolean().default(false),
    fatTargetG: nonNegativeNumber,
    fatTargetOverridden: z.boolean().default(false),
    fibreTargetG: nonNegativeNumber,
    fibreTargetOverridden: z.boolean().default(false),
    waterTargetMl: z.number().int().positive(),
    waterTargetOverridden: z.boolean().default(false),
  })
  .refine((data) => data.targetDuration !== 'custom' || !!data.customEndDate, {
    message: 'customEndDate is required when targetDuration is "custom"',
    path: ['customEndDate'],
  })
export type CreateGoalInput = z.infer<typeof createGoalSchema>

export const updateGoalOverridesSchema = z.object({
  calorieTarget: positiveNumber.optional(),
  proteinTargetG: nonNegativeNumber.optional(),
  carbsTargetG: nonNegativeNumber.optional(),
  fatTargetG: nonNegativeNumber.optional(),
  fibreTargetG: nonNegativeNumber.optional(),
  waterTargetMl: z.number().int().positive().optional(),
})
export type UpdateGoalOverridesInput = z.infer<typeof updateGoalOverridesSchema>
