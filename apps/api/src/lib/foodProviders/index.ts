import type { Env } from '../../types/env.js'
import { searchOpenFoodFacts } from './openFoodFacts.js'
import { searchUsda } from './usda.js'
import type { ExternalFoodResult } from './types.js'

const CACHE_TTL_SECONDS = 60 * 60 * 24 // Provider nutrition data doesn't change day to day.

function cacheKey(query: string, limit: number): string {
  return `food-search:${query.trim().toLowerCase()}:${limit}`
}

/**
 * Tries providers in priority order (OpenFoodFacts, then USDA) and stops at
 * the first one with results — this is the FoodProvider fan-out described in
 * the architecture doc. Results are cached in KV so a repeated search never
 * re-hits either external API.
 */
export async function searchExternalProviders(
  env: Env,
  query: string,
  limit: number,
): Promise<ExternalFoodResult[]> {
  const key = cacheKey(query, limit)
  const cached = await env.CACHE.get(key, 'json')
  if (cached) return cached as ExternalFoodResult[]

  let results = await searchOpenFoodFacts(query, limit).catch(() => [])
  if (results.length === 0) {
    results = await searchUsda(query, limit, env.USDA_FDC_API_KEY).catch(() => [])
  }

  await env.CACHE.put(key, JSON.stringify(results), { expirationTtl: CACHE_TTL_SECONDS })
  return results
}

export type { ExternalFoodResult }
