import type { ActivityLevel, Goal, MealType, TargetDuration, UnitSystem } from '../constants.js'

export interface GoalRecord {
  id: string
  goalType: Goal
  startingWeightKg: number
  targetWeightKg: number
  targetDuration: TargetDuration
  customEndDate: string | null
  activityLevel: ActivityLevel
  bmr: number
  tdee: number
  calorieTarget: number
  calorieTargetOverridden: boolean
  proteinTargetG: number
  proteinTargetOverridden: boolean
  carbsTargetG: number
  carbsTargetOverridden: boolean
  fatTargetG: number
  fatTargetOverridden: boolean
  fibreTargetG: number
  fibreTargetOverridden: boolean
  waterTargetMl: number
  waterTargetOverridden: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FoodRecord {
  id: string
  source: 'openfoodfacts' | 'usda' | 'custom'
  sourceId: string | null
  barcode: string | null
  name: string
  brand: string | null
  servingSize: number
  servingUnit: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG: number
  isFavourite?: boolean
}

export interface RecipeItemRecord {
  id: string
  foodId: string
  food?: FoodRecord
  quantity: number
  unit: string
}

export interface RecipeRecord {
  id: string
  name: string
  servings: number
  instructions: string | null
  items: RecipeItemRecord[]
  /** Per-serving totals, derived from items and `servings`. */
  caloriesPerServing: number
  proteinGPerServing: number
  carbsGPerServing: number
  fatGPerServing: number
  fibreGPerServing: number
  createdAt: string
  updatedAt: string
}

export interface MealItemRecord {
  id: string
  foodId: string | null
  recipeId: string | null
  food?: FoodRecord
  quantity: number
  unit: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG: number
  aiConfidence: number | null
}

export interface MealRecord {
  id: string
  mealType: MealType
  loggedAt: string
  photoR2Key: string | null
  notes: string | null
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  totalFibreG: number
  items: MealItemRecord[]
  createdAt: string
  updatedAt: string
}

export interface WaterLogRecord {
  id: string
  amountMl: number
  loggedAt: string
  createdAt: string
}

export interface WeightLogRecord {
  id: string
  weightKg: number
  loggedAt: string
  notes: string | null
  createdAt: string
}

export interface SettingsRecord {
  unitSystem: UnitSystem
  theme: 'light' | 'dark' | 'system'
  updatedAt: string
}

export interface NotificationSettingsRecord {
  onesignalPlayerId: string | null
  breakfastReminderTime: string | null
  lunchReminderTime: string | null
  dinnerReminderTime: string | null
  waterReminderEnabled: boolean
  waterReminderIntervalMinutes: number | null
  weighInReminderTime: string | null
  weighInReminderDays: number[]
  quietHoursStart: string | null
  quietHoursEnd: string | null
  timezone: string
  updatedAt: string
}

export interface CustomReminderRecord {
  id: string
  label: string
  time: string
  daysOfWeek: number[]
  enabled: boolean
  createdAt: string
}
