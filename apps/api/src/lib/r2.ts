import type { Env } from '../types/env.js'

function keyFor(imageHash: string): string {
  return `meal-photos/${imageHash}`
}

/** Content-addressed by hash — re-uploading the same photo overwrites the same key, never duplicates it. */
export async function putMealImage(
  env: Env,
  imageHash: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const key = keyFor(imageHash)
  await env.MEAL_IMAGES.put(key, bytes, { httpMetadata: { contentType } })
  return key
}
