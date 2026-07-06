import type { Env } from '../../types/env.js'
import { searchOpenFoodFacts } from './openFoodFacts.js'
import { searchUsda } from './usda.js'
import type { ExternalFoodResult } from './types.js'

const CACHE_TTL_SECONDS = 60 * 60 * 24 // Provider nutrition data doesn't change day to day.

function cacheKey(query: string, limit: number): string {
  return `food-search:${query.trim().toLowerCase()}:${limit}`
}

function normalizedKey(result: ExternalFoodResult): string {
  return `${result.name}|${result.brand ?? ''}`.toLowerCase().replace(/[^a-z0-9|]/g, '')
}

/**
 * Queries both providers concurrently and interleaves their results — USDA's
 * dataset is small and curated (one good entry per food), while OpenFoodFacts
 * is crowdsourced and returns far more, noisier hits for the same query.
 * Concatenating OFF-first would bury USDA's better matches under a wall of
 * near-duplicate branded products, so results alternate rank-by-rank (USDA's
 * pick at a given rank before OFF's), with exact name+brand duplicates across
 * either provider dropped. The caller still trims to the requested limit.
 * Cached in KV so a repeated search never re-hits either external API.
 */
export async function searchExternalProviders(
  env: Env,
  query: string,
  limit: number,
): Promise<ExternalFoodResult[]> {
  const key = cacheKey(query, limit)
  const cached = await env.CACHE.get(key, 'json')
  if (cached) return cached as ExternalFoodResult[]

  const [offResults, usdaResults] = await Promise.all([
    searchOpenFoodFacts(query, limit).catch(() => []),
    searchUsda(query, limit, env.USDA_FDC_API_KEY).catch(() => []),
  ])

  const seen = new Set<string>()
  const merged: ExternalFoodResult[] = []
  for (let i = 0; i < Math.max(offResults.length, usdaResults.length); i++) {
    for (const result of [usdaResults[i], offResults[i]]) {
      if (!result) continue
      const dedupeKey = normalizedKey(result)
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      merged.push(result)
    }
  }

  await env.CACHE.put(key, JSON.stringify(merged), { expirationTtl: CACHE_TTL_SECONDS })
  return merged
}

export type { ExternalFoodResult }
