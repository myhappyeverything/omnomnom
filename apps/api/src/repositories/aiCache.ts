import type { Env } from '../types/env.js'
import { newId, nowIso } from '../lib/db.js'
import type { OpenAiFoodItem } from '../lib/openai.js'

export interface AiCacheRow {
  id: string
  image_hash: string
  r2_key: string
  model: string
  recognized_foods_json: string
  created_at: string
}

export async function findByImageHash(env: Env, imageHash: string): Promise<AiCacheRow | null> {
  return env.DB.prepare('SELECT * FROM ai_cache WHERE image_hash = ?')
    .bind(imageHash)
    .first<AiCacheRow>()
}

export async function create(
  env: Env,
  input: { imageHash: string; r2Key: string; model: string; items: OpenAiFoodItem[] },
): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO ai_cache (id, image_hash, r2_key, model, recognized_foods_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(newId(), input.imageHash, input.r2Key, input.model, JSON.stringify(input.items), nowIso())
    .run()
}
