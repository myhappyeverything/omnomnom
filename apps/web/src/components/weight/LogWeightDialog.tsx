import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { createWeightLog } from '@/api/weight'
import { ApiError } from '@/api/client'

export function LogWeightDialog({ suggestedWeightKg }: { suggestedWeightKg: number | null }) {
  const [open, setOpen] = useState(false)
  const [weightKg, setWeightKg] = useState(suggestedWeightKg ?? 70)
  const queryClient = useQueryClient()

  const logMutation = useMutation({
    mutationFn: () => createWeightLog({ weightKg }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight'] })
      toast.success('Weight logged')
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
        if (next) setWeightKg(suggestedWeightKg ?? weightKg)
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
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input
            id="weightKg"
            type="number"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
          />
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            disabled={weightKg <= 0 || logMutation.isPending}
            onClick={() => logMutation.mutate()}
          >
            {logMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
