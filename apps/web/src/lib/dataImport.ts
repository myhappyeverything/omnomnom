import { createWaterLog } from '@/api/water'
import { createWeightLog } from '@/api/weight'

export interface ImportResult {
  waterImported: number
  weightImported: number
  errors: string[]
}

/**
 * Restores water and weight logs from a file produced by the "Download my
 * data" export. Reuses the same create endpoints normal logging uses, so the
 * server-side clientId dedup (Stage 5) makes re-running the same file a
 * no-op the second time instead of creating duplicates — the export's own
 * record id is passed through as the clientId for exactly that reason.
 *
 * Only water and weight are restored. Meals, goals, and everything else in
 * the export are there for backup/portability, but meal items reference
 * food/recipe ids that only resolve reliably when restoring into the same
 * account they were exported from — reconstructing that safely is out of
 * scope here.
 */
export async function importDataExport(fileText: string): Promise<ImportResult> {
  const parsed: unknown = JSON.parse(fileText)
  const result: ImportResult = { waterImported: 0, weightImported: 0, errors: [] }
  if (typeof parsed !== 'object' || parsed === null) {
    result.errors.push('This file is not a valid Purple export.')
    return result
  }
  const data = parsed as Record<string, unknown>

  const waterLogs = Array.isArray(data.waterLogs) ? data.waterLogs : []
  for (const entry of waterLogs) {
    const log = entry as { id?: unknown; amountMl?: unknown; loggedAt?: unknown }
    try {
      await createWaterLog({
        amountMl: log.amountMl as number,
        loggedAt: log.loggedAt as string,
        clientId: log.id as string,
      })
      result.waterImported++
    } catch (error) {
      result.errors.push(
        `Water entry: ${error instanceof Error ? error.message : 'could not be imported'}`,
      )
    }
  }

  const weightLogs = Array.isArray(data.weightLogs) ? data.weightLogs : []
  for (const entry of weightLogs) {
    const log = entry as { id?: unknown; weightKg?: unknown; loggedAt?: unknown; notes?: unknown }
    try {
      await createWeightLog({
        weightKg: log.weightKg as number,
        loggedAt: log.loggedAt as string,
        notes: (log.notes as string | null) ?? undefined,
        clientId: log.id as string,
      })
      result.weightImported++
    } catch (error) {
      result.errors.push(
        `Weight entry: ${error instanceof Error ? error.message : 'could not be imported'}`,
      )
    }
  }

  return result
}
