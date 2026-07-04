import { z } from 'zod'
import { UNIT_SYSTEM_VALUES } from '../constants.js'

export const updateSettingsSchema = z.object({
  unitSystem: z.enum(UNIT_SYSTEM_VALUES).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
