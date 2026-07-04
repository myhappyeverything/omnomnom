import { z } from 'zod'

export const createWaterLogSchema = z.object({
  amountMl: z.number().int().positive().max(10_000),
  loggedAt: z.string().datetime().optional(),
  clientId: z.string().uuid().optional(),
})
export type CreateWaterLogInput = z.infer<typeof createWaterLogSchema>

export const listWaterLogsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})
export type ListWaterLogsQuery = z.infer<typeof listWaterLogsQuerySchema>
