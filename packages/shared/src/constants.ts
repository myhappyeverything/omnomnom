export const SEX_VALUES = ['male', 'female'] as const
export type Sex = (typeof SEX_VALUES)[number]

export const ACTIVITY_LEVEL_VALUES = [
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extremely_active',
] as const
export type ActivityLevel = (typeof ACTIVITY_LEVEL_VALUES)[number]

/** Multiplier applied to BMR to derive maintenance calories (TDEE). */
export const ACTIVITY_LEVEL_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
}

export const GOAL_VALUES = ['lose_weight', 'maintain', 'gain_weight'] as const
export type Goal = (typeof GOAL_VALUES)[number]

export const TARGET_DURATION_VALUES = [
  '2_weeks',
  '4_weeks',
  '8_weeks',
  '12_weeks',
  'custom',
] as const
export type TargetDuration = (typeof TARGET_DURATION_VALUES)[number]

export const TARGET_DURATION_WEEKS: Record<Exclude<TargetDuration, 'custom'>, number> = {
  '2_weeks': 2,
  '4_weeks': 4,
  '8_weeks': 8,
  '12_weeks': 12,
}

export const MEAL_TYPE_VALUES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEAL_TYPE_VALUES)[number]

export const UNIT_SYSTEM_VALUES = ['metric', 'imperial'] as const
export type UnitSystem = (typeof UNIT_SYSTEM_VALUES)[number]

/** Preset quick-add volumes for the water tracker, in millilitres. */
export const WATER_QUICK_ADD_ML = [250, 500, 750, 1000] as const

export const NUTRITION_SCORE_BANDS = {
  excellent: { min: 85, label: 'Excellent' },
  good: { min: 70, label: 'Good' },
  fair: { min: 50, label: 'Fair' },
  needsImprovement: { min: 0, label: 'Needs Improvement' },
} as const

export type NutritionScoreLabel =
  (typeof NUTRITION_SCORE_BANDS)[keyof typeof NUTRITION_SCORE_BANDS]['label']
