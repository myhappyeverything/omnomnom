import { z } from 'zod'

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const analyzePhotoSchema = z.object({
  /** Raw base64 (no data: prefix) of a client-compressed image. */
  imageBase64: z.string().min(1).max(10_000_000),
  mimeType: z.enum(IMAGE_MIME_TYPES),
})
export type AnalyzePhotoInput = z.infer<typeof analyzePhotoSchema>

export const analyzeLabelSchema = z.object({
  /** Raw base64 (no data: prefix) of a client-compressed photo of a nutrition facts label. */
  imageBase64: z.string().min(1).max(10_000_000),
  mimeType: z.enum(IMAGE_MIME_TYPES),
})
export type AnalyzeLabelInput = z.infer<typeof analyzeLabelSchema>
