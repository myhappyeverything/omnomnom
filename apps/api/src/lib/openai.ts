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

/** Text-only when `image` is omitted, vision when it's provided — both use the same JSON-schema chat completion setup. */
async function callChatJson<T>(
  apiKey: string,
  systemPrompt: string,
  userText: string,
  jsonSchemaName: string,
  schema: object,
  image?: { base64: string; mimeType: string },
): Promise<T> {
  if (!apiKey) {
    throw new OpenAiError('OpenAI API key is not configured')
  }

  const userContent = image
    ? [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
      ]
    : userText

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
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
  const parsed = await callChatJson<{ items: OpenAiFoodItem[] }>(
    apiKey,
    SYSTEM_PROMPT,
    'Identify the foods in this photo.',
    'food_identification',
    RESPONSE_SCHEMA,
    { base64: imageBase64, mimeType },
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
  return callChatJson<OpenAiLabelResult>(
    apiKey,
    LABEL_SYSTEM_PROMPT,
    'Read the nutrition facts label in this photo.',
    'nutrition_label',
    LABEL_RESPONSE_SCHEMA,
    { base64: imageBase64, mimeType },
  )
}

const FOOD_QUALITY_SYSTEM_PROMPT = `You are a nutrition-quality assessor for a nutrition tracking app.
Your job is to judge the OVERALL QUALITY of a day's eating pattern — not to punish individual
meals or treats. Score each meal individually (0-100), then give an overall score (0-100) for the
day as a whole, weighing the day's overall pattern more heavily than any single meal. One dessert
or fast-food meal should only slightly lower an otherwise balanced day — don't let a single item
dominate the score.

Consider, using the food names and their tracked macros (calories, protein, carbs, fat, fibre per
item):
- Whole vs ultra-processed foods
- Variety of foods across the day
- Fruit and vegetable intake
- Whole grains
- Lean proteins
- Healthy fats (olive oil, avocado, nuts, oily fish) vs a lot of saturated fat from fried or
  heavily processed foods — infer this from the food names themselves and how calorie-dense the
  tracked fat grams are relative to the item's total calories, since exact fat subtypes aren't
  tracked
- Added sugars and refined carbohydrates
- Balance across meals (not everything crammed into one meal, not skipping meals)

Calibration reference points for individual meal scores (not hard rules):
- Chicken, rice & broccoli -> ~90
- Homemade chilli with beans -> ~90
- Greek yoghurt with berries -> ~95
- Protein shake -> ~70
- Fast food burger meal -> ~30
- Packaged sweets & soft drinks -> ~15

Only judge what's actually logged — never invent or assume foods that aren't listed.`

const FOOD_QUALITY_SCHEMA = {
  type: 'object',
  properties: {
    mealScores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          mealType: { type: 'string' },
          score: { type: 'number', minimum: 0, maximum: 100 },
        },
        required: ['mealType', 'score'],
        additionalProperties: false,
      },
    },
    overallScore: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: "The day's eating pattern as a whole, not an average of the meal scores.",
    },
  },
  required: ['mealScores', 'overallScore'],
  additionalProperties: false,
} as const

export interface FoodQualityMealInput {
  mealType: string
  items: {
    name: string
    quantity: number
    unit: string
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fibreG: number
  }[]
}

export interface FoodQualityResult {
  overallScore: number
  mealScores: { mealType: string; score: number }[]
}

function describeMealsForPrompt(meals: FoodQualityMealInput[]): string {
  return meals
    .map((meal) => {
      const lines = meal.items.map(
        (item) =>
          `- ${item.name}, ${item.quantity}${item.unit} (${Math.round(item.calories)} kcal, ` +
          `${Math.round(item.proteinG)}g protein, ${Math.round(item.carbsG)}g carbs, ` +
          `${Math.round(item.fatG)}g fat, ${Math.round(item.fibreG)}g fibre)`,
      )
      return `${meal.mealType}:\n${lines.join('\n')}`
    })
    .join('\n\n')
}

export async function assessFoodQuality(
  apiKey: string,
  meals: FoodQualityMealInput[],
): Promise<FoodQualityResult> {
  const userText = `Today's logged meals:\n\n${describeMealsForPrompt(meals)}\n\nAssess the nutritional quality of this day's eating pattern.`
  return callChatJson<FoodQualityResult>(
    apiKey,
    FOOD_QUALITY_SYSTEM_PROMPT,
    userText,
    'food_quality_assessment',
    FOOD_QUALITY_SCHEMA,
  )
}
