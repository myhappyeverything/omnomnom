import type { AnalyzePhotoInput, PhotoAnalysisResult, RecognizedFoodItem } from '@purple/shared'
import type { Env } from '../types/env.js'
import { sha256HexFromBytes } from '../lib/crypto.js'
import { base64ToArrayBuffer } from '../lib/encoding.js'
import { putMealImage } from '../lib/r2.js'
import { identifyFoodsInImage, type OpenAiFoodItem } from '../lib/openai.js'
import * as aiCacheRepo from '../repositories/aiCache.js'
import * as foodsService from './foods.js'

const MODEL = 'gpt-4o-mini'

export async function analyzePhoto(
  env: Env,
  userId: string,
  input: AnalyzePhotoInput,
): Promise<PhotoAnalysisResult> {
  const imageBytes = base64ToArrayBuffer(input.imageBase64)
  const imageHash = await sha256HexFromBytes(imageBytes)

  const cached = await aiCacheRepo.findByImageHash(env, imageHash)
  let recognized: OpenAiFoodItem[]
  let r2Key: string
  let fromCache: boolean

  if (cached) {
    recognized = JSON.parse(cached.recognized_foods_json) as OpenAiFoodItem[]
    r2Key = cached.r2_key
    fromCache = true
  } else {
    // Store the image before calling the (paid) API — if the AI call fails we've
    // still deduped the upload, and a retry of the same photo won't re-upload it.
    r2Key = await putMealImage(env, imageHash, imageBytes, input.mimeType)
    recognized = await identifyFoodsInImage(env.OPENAI_API_KEY, input.imageBase64, input.mimeType)
    await aiCacheRepo.create(env, { imageHash, r2Key, model: MODEL, items: recognized })
    fromCache = false
  }

  // Nutrition always comes from the food database, never from the AI — for each
  // identified name we search local-then-external providers for a real match.
  const items: RecognizedFoodItem[] = await Promise.all(
    recognized.map(async (item): Promise<RecognizedFoodItem> => {
      const matches = await foodsService.searchFoods(env, userId, item.name, 1)
      return {
        name: item.name,
        estimatedQuantityGrams: item.estimatedQuantityGrams,
        confidence: item.confidence,
        matchedFood: matches[0] ?? null,
      }
    }),
  )

  return { imageHash, r2Key, items, fromCache }
}
