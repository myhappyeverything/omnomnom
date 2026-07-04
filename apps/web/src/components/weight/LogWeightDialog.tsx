import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { UnitSystem } from '@omnomnom/shared'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWeightLog, type OfflineWeightLogRecord } from '@/api/weight'
import { ApiError } from '@/api/client'
import { displayWeight, toStoredKg, weightUnitLabel } from '@/utils/units'

export function LogWeightDialog({
  suggestedWeightKg,
  unitSystem,
}: {
  suggestedWeightKg: number | null
  unitSystem: UnitSystem
}) {
  const [open, setOpen] = useState(false)
  const suggestedDisplayValue =
    suggestedWeightKg !== null
      ? Math.round(displayWeight(suggestedWeightKg, unitSystem) * 10) / 10
      : 70
  const [displayValue, setDisplayValue] = useState(suggestedDisplayValue)
  const unitLabel = weightUnitLabel(unitSystem)
  const queryClient = useQueryClient()

  const logMutation = useMutation({
    mutationFn: () => createWeightLog({ weightKg: toStoredKg(displayValue, unitSystem) }),
    onSuccess: (log) => {
      if (log.pending) {
        queryClient.setQueriesData<OfflineWeightLogRecord[]>(
          { queryKey: ['weight', 'history'] },
          (old) => (old ? [...old, log] : [log]),
        )
        toast.info("Weight queued — will sync once you're back online")
      } else {
        queryClient.invalidateQueries({ queryKey: ['weight'] })
        toast.success('Weight logged')
      }
      setOpen(false)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not log weight')
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDisplayValue(suggestedDisplayValue)
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full">Log weight</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log your weight</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="weightValue">Weight ({unitLabel})</Label>
          <Input
            id="weightValue"
            type="number"
            step="0.1"
            value={displayValue}
            onChange={(e) => setDisplayValue(Number(e.target.value))}
          />
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            disabled={displayValue <= 0 || logMutation.isPending}
            onClick={() => logMutation.mutate()}
          >
            {logMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
