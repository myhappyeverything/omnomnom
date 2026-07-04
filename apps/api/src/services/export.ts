import type {
  CustomReminderRecord,
  FoodRecord,
  GoalRecord,
  MealRecord,
  NotificationSettingsRecord,
  RecipeRecord,
  SettingsRecord,
  WaterLogRecord,
  WeightLogRecord,
} from '@omnomnom/shared'
import type { Env } from '../types/env.js'
import * as goalsService from './goals.js'
import * as waterService from './water.js'
import * as weightService from './weight.js'
import * as mealsService from './meals.js'
import * as foodsService from './foods.js'
import * as recipesService from './recipes.js'
import * as settingsService from './settings.js'
import * as notificationsService from './notifications.js'

export const EXPORT_FORMAT_VERSION = 1

export interface DataExport {
  version: typeof EXPORT_FORMAT_VERSION
  exportedAt: string
  settings: SettingsRecord
  notificationSettings: NotificationSettingsRecord
  customReminders: CustomReminderRecord[]
  goals: GoalRecord[]
  waterLogs: WaterLogRecord[]
  weightLogs: WeightLogRecord[]
  meals: MealRecord[]
  customFoods: FoodRecord[]
  recipes: RecipeRecord[]
}

/** Everything the app knows about a user, for a personal backup/download — not a full account-migration format. */
export async function exportUserData(env: Env, userId: string): Promise<DataExport> {
  const [
    settings,
    notificationSettings,
    customReminders,
    goals,
    waterLogs,
    weightLogs,
    meals,
    customFoods,
    recipes,
  ] = await Promise.all([
    settingsService.getSettings(env, userId),
    notificationsService.getNotificationSettings(env, userId),
    notificationsService.listCustomReminders(env, userId),
    goalsService.listGoals(env, userId),
    waterService.listWaterLogs(env, userId, {}),
    weightService.listWeightLogs(env, userId, {}),
    mealsService.listMeals(env, userId, {}),
    foodsService.listCustomFoods(env, userId),
    recipesService.listRecipes(env, userId),
  ])

  return {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    notificationSettings,
    customReminders,
    goals,
    waterLogs,
    weightLogs,
    meals,
    customFoods,
    recipes,
  }
}
