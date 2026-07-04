import type { ActivityLevel, Goal, MealType, Sex, TargetDuration } from '@purple/shared'

/** Raw D1 `users` row shape (snake_case, matches the schema exactly). */
export interface UserRow {
  id: string
  name: string
  email: string
  password_hash: string
  password_salt: string
  password_iterations: number
  date_of_birth: string
  sex: Sex
  height_cm: number
  created_at: string
  updated_at: string
}

export interface RefreshTokenRow {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  revoked_at: string | null
  created_at: string
}

export interface GoalRow {
  id: string
  user_id: string
  goal_type: Goal
  starting_weight_kg: number
  target_weight_kg: number
  target_duration: TargetDuration
  custom_end_date: string | null
  activity_level: ActivityLevel
  bmr: number
  tdee: number
  calorie_target: number
  calorie_target_overridden: 0 | 1
  protein_target_g: number
  protein_target_overridden: 0 | 1
  carbs_target_g: number
  carbs_target_overridden: 0 | 1
  fat_target_g: number
  fat_target_overridden: 0 | 1
  fibre_target_g: number
  fibre_target_overridden: 0 | 1
  water_target_ml: number
  water_target_overridden: 0 | 1
  is_active: 0 | 1
  created_at: string
  updated_at: string
}

export interface FoodRow {
  id: string
  source: 'openfoodfacts' | 'usda' | 'custom'
  source_id: string | null
  barcode: string | null
  name: string
  brand: string | null
  serving_size: number
  serving_unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fibre_g: number
  created_by_user_id: string | null
  created_at: string
  updated_at: string
}

export interface RecipeRow {
  id: string
  user_id: string
  name: string
  servings: number
  instructions: string | null
  created_at: string
  updated_at: string
}

export interface RecipeItemRow {
  id: string
  recipe_id: string
  food_id: string
  quantity: number
  unit: string
  sort_order: number
}

export interface MealRow {
  id: string
  user_id: string
  meal_type: MealType
  logged_at: string
  photo_r2_key: string | null
  notes: string | null
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fibre_g: number
  client_id: string | null
  created_at: string
  updated_at: string
}

export interface MealItemRow {
  id: string
  meal_id: string
  food_id: string | null
  recipe_id: string | null
  quantity: number
  unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fibre_g: number
  ai_confidence: number | null
  sort_order: number
}

export interface WaterLogRow {
  id: string
  user_id: string
  amount_ml: number
  logged_at: string
  client_id: string | null
  created_at: string
}

export interface WeightLogRow {
  id: string
  user_id: string
  weight_kg: number
  logged_at: string
  notes: string | null
  client_id: string | null
  created_at: string
}

export interface SettingsRow {
  user_id: string
  unit_system: 'metric' | 'imperial'
  theme: 'light' | 'dark' | 'system'
  updated_at: string
}

export interface NotificationSettingsRow {
  user_id: string
  onesignal_player_id: string | null
  breakfast_reminder_time: string | null
  lunch_reminder_time: string | null
  dinner_reminder_time: string | null
  water_reminder_enabled: 0 | 1
  water_reminder_interval_minutes: number | null
  weigh_in_reminder_time: string | null
  weigh_in_reminder_days: string
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  weekday_schedule_json: string | null
  weekend_schedule_json: string | null
  timezone: string
  updated_at: string
}

export interface CustomReminderRow {
  id: string
  user_id: string
  label: string
  time: string
  days_of_week: string
  enabled: 0 | 1
  created_at: string
}

export interface RecentFoodRow {
  id: string
  user_id: string
  food_id: string
  last_logged_at: string
  log_count: number
}

export interface FavouriteFoodRow {
  id: string
  user_id: string
  food_id: string
  created_at: string
}
