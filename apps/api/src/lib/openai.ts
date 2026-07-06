const SYSTEM_PROMPT = `You are a food identification assistant for a nutrition tracking app.
Identify every distinct food item visible in the photo. For each item, estimate its portion
size in grams and how confident you are in the identification (0 to 1).
Only report food you can actually see. Do not estimate calories, protein, carbs, fat, or fibre —
another system looks up real nutrition data for whatever you name, so your job is identification
and portion-size estimation only.`

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'A concise, searchable food name, e.g. "grilled chicken breast"',
          },
          estimatedQuantityGrams: { type: 'number' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['name', 'estimatedQuantityGrams', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
} as const

export interface OpenAiFoodItem {
  name: string
  estimatedQuantityGrams: number
  confidence: number
}

interface OpenAiChatResponse {
  choices?: { message?: { content?: string } }[]
}

export class OpenAiError extends Error {}

async function callVision<T>(
  apiKey: string,
  systemPrompt: string,
  userText: string,
  imageBase64: string,
  mimeType: string,
  jsonSchemaName: string,
  schema: object,
): Promise<T> {
  if (!apiKey) {
    throw new OpenAiError('OpenAI API key is not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: jsonSchemaName, strict: true, schema },
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new OpenAiError(`OpenAI request failed (${response.status}): ${body.slice(0, 500)}`)
  }

  const data = await response.json<OpenAiChatResponse>()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new OpenAiError('OpenAI returned an empty response')
  }

  return JSON.parse(content) as T
}

export async function identifyFoodsInImage(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
): Promise<OpenAiFoodItem[]> {
  const parsed = await callVision<{ items: OpenAiFoodItem[] }>(
    apiKey,
    SYSTEM_PROMPT,
    'Identify the foods in this photo.',
    imageBase64,
    mimeType,
    'food_identification',
    RESPONSE_SCHEMA,
  )
  return parsed.items
}

const LABEL_SYSTEM_PROMPT = `You are a nutrition facts label reader for a nutrition tracking app.
Read the nutrition facts label in the photo and report exactly what is printed on it — per the
serving size printed on the label, not per 100g unless that's what the label itself uses. If a
field isn't visible, legible, or printed on the label, report it as null rather than guessing.`

const LABEL_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: ['string', 'null'], description: 'Product name, if printed on the label' },
    brand: { type: ['string', 'null'] },
    servingSize: { type: ['number', 'null'] },
    servingUnit: { type: ['string', 'null'], description: 'e.g. "g", "ml", "piece"' },
    calories: { type: ['number', 'null'] },
    proteinG: { type: ['number', 'null'] },
    carbsG: { type: ['number', 'null'] },
    fatG: { type: ['number', 'null'] },
    fibreG: { type: ['number', 'null'] },
  },
  required: [
    'name',
    'brand',
    'servingSize',
    'servingUnit',
    'calories',
    'proteinG',
    'carbsG',
    'fatG',
    'fibreG',
  ],
  additionalProperties: false,
} as const

export interface OpenAiLabelResult {
  name: string | null
  brand: string | null
  servingSize: number | null
  servingUnit: string | null
  calories: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  fibreG: number | null
}

export async function extractNutritionLabel(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
): Promise<OpenAiLabelResult> {
  return callVision<OpenAiLabelResult>(
    apiKey,
    LABEL_SYSTEM_PROMPT,
    'Read the nutrition facts label in this photo.',
    imageBase64,
    mimeType,
    'nutrition_label',
    LABEL_RESPONSE_SCHEMA,
  )
}
