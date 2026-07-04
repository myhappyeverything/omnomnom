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

export async function identifyFoodsInImage(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
): Promise<OpenAiFoodItem[]> {
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
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify the foods in this photo.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'food_identification', strict: true, schema: RESPONSE_SCHEMA },
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

  const parsed = JSON.parse(content) as { items: OpenAiFoodItem[] }
  return parsed.items
}
