import { round2 } from '../numbers.js'
import type { ExternalFoodResult } from './types.js'

interface OpenFoodFactsHit {
  code?: string
  product_name?: string
  brands?: string[]
  nutriments?: Record<string, number>
}

interface OpenFoodFactsSearchResponse {
  hits?: OpenFoodFactsHit[]
}

/**
 * OpenFoodFacts reports nutrition per 100g/100ml for virtually every product
 * (unlike per-serving values, which are inconsistently populated), so that's
 * what we standardize on rather than trying to parse each product's own
 * serving_size string.
 *
 * Uses the search-a-licious API (search.openfoodfacts.org) — the legacy
 * cgi/search.pl endpoint this superseded returns intermittent 503s.
 */
export async function searchOpenFoodFacts(
  query: string,
  limit: number,
): Promise<ExternalFoodResult[]> {
  const url = new URL('https://search.openfoodfacts.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('page_size', String(limit))

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Purple - Personal Nutrition Tracker - Version 1.0' },
  })
  if (!response.ok) return []

  const data = await response.json<OpenFoodFactsSearchResponse>()
  return (data.hits ?? [])
    .filter((hit) => hit.product_name && hit.nutriments?.['energy-kcal_100g'] != null)
    .map((hit) => ({
      source: 'openfoodfacts' as const,
      sourceId: hit.code ?? crypto.randomUUID(),
      name: hit.product_name!,
      brand: hit.brands?.[0]?.trim() || null,
      barcode: hit.code || null,
      servingSize: 100,
      servingUnit: 'g',
      calories: round2(hit.nutriments!['energy-kcal_100g']!),
      proteinG: round2(hit.nutriments!['proteins_100g'] ?? 0),
      carbsG: round2(hit.nutriments!['carbohydrates_100g'] ?? 0),
      fatG: round2(hit.nutriments!['fat_100g'] ?? 0),
      fibreG: round2(hit.nutriments!['fiber_100g'] ?? 0),
    }))
}
