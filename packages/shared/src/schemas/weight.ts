import { z } from 'zod'

export const createWeightLogSchema = z.object({
  weightKg: z.number().positive().max(500),
  loggedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  clientId: z.string().uuid().optional(),
})
export type CreateWeightLogInput = z.infer<typeof createWeightLogSchema>

export const listWeightLogsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})
export type ListWeightLogsQuery = z.infer<typeof listWeightLogsQuerySchema>
