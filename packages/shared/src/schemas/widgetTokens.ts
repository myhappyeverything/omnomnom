import { z } from 'zod'

export const createWidgetTokenSchema = z.object({
  label: z.string().trim().min(1).max(60),
})
export type CreateWidgetTokenInput = z.infer<typeof createWidgetTokenSchema>
