import type { Env } from '../types/env.js'
import { newId, nowIso } from '../lib/db.js'

export interface FoodQualityCacheRow {
  id: string
  user_id: string
  date_key: string
  meals_hash: string
  overall_score: number
  meal_scores_json: string
  created_at: string
  updated_at: string
}

export async function findByUserAndDate(
  env: Env,
  userId: string,
  dateKey: string,
): Promise<FoodQualityCacheRow | null> {
  return env.DB.prepare('SELECT * FROM food_quality_cache WHERE user_id = ? AND date_key = ?')
    .bind(userId, dateKey)
    .first<FoodQualityCacheRow>()
}

export async function upsert(
  env: Env,
  input: {
    userId: string
    dateKey: string
    mealsHash: string
    overallScore: number
    mealScoresJson: string
  },
): Promise<void> {
  const timestamp = nowIso()
  await env.DB.prepare(
    `INSERT INTO food_quality_cache
      (id, user_id, date_key, meals_hash, overall_score, meal_scores_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date_key) DO UPDATE SET
       meals_hash = excluded.meals_hash,
       overall_score = excluded.overall_score,
       meal_scores_json = excluded.meal_scores_json,
       updated_at = excluded.updated_at`,
  )
    .bind(
      newId(),
      input.userId,
      input.dateKey,
      input.mealsHash,
      input.overallScore,
      input.mealScoresJson,
      timestamp,
      timestamp,
    )
    .run()
}
