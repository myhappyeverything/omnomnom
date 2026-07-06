import { z } from 'zod'

const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const nutritionScoreQuerySchema = z.object({
  date: z.string().regex(DATE_KEY_REGEX),
  from: z.string().datetime(),
  to: z.string().datetime(),
  /** The browser's `new Date().getTimezoneOffset()` — lets the (UTC) worker bucket ISO
   *  timestamps into the same local day the user would see on their own device. */
  tzOffsetMinutes: z.coerce.number().int(),
})
export type NutritionScoreQuery = z.infer<typeof nutritionScoreQuerySchema>

export const nutritionScoreRangeQuerySchema = z.object({
  /** Comma-separated "YYYY-MM-DD" keys, e.g. from lastNDayKeys or a calendar month grid. */
  dateKeys: z
    .string()
    .min(1)
    .transform((value) => value.split(','))
    .pipe(z.array(z.string().regex(DATE_KEY_REGEX)).min(1).max(200)),
  from: z.string().datetime(),
  to: z.string().datetime(),
  tzOffsetMinutes: z.coerce.number().int(),
})
export type NutritionScoreRangeQuery = z.infer<typeof nutritionScoreRangeQuerySchema>
