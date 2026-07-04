import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Flame, Trash2 } from 'lucide-react'
import { WATER_QUICK_ADD_ML } from '@purple/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ProgressRing } from '@/components/ProgressRing'
import { Skeleton } from '@/components/ui/skeleton'
import { createWaterLog, deleteWaterLog, type OfflineWaterLogRecord } from '@/api/water'
import { ApiError } from '@/api/client'
import { useWaterHistory } from '@/hooks/useWaterHistory'

export function WaterPage() {
  const { isLoading, targetMl, todayTotalMl, dailyTotals, streak, todayLogs } = useWaterHistory()
  const [customAmount, setCustomAmount] = useState(200)
  const [customOpen, setCustomOpen] = useState(false)
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: (amountMl: number) => createWaterLog({ amountMl }),
    onSuccess: (log, amountMl) => {
      if (log.pending) {
        queryClient.setQueriesData<OfflineWaterLogRecord[]>(
          { queryKey: ['water', 'history'] },
          (old) => (old ? [...old, log] : [log]),
        )
        toast.info(`${amountMl}ml queued — will sync once you're back online`)
      } else {
        queryClient.invalidateQueries({ queryKey: ['water'] })
        toast.success(`${amountMl}ml logged`)
      }
      setCustomOpen(false)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not log water')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWaterLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water'] })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not remove this entry')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="rounded-card h-40 w-full" />
        <Skeleton className="rounded-card h-24 w-full" />
        <Skeleton className="rounded-card h-64 w-full" />
      </div>
    )
  }

  const percent = targetMl > 0 ? (todayTotalMl / targetMl) * 100 : 0
  const maxDayTotal = Math.max(...dailyTotals.map((d) => d.totalMl), targetMl, 1)

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-3">
          <ProgressRing value={percent} size={140} strokeWidth={12}>
            <div className="text-center">
              <div className="text-foreground text-2xl font-semibold">
                {(todayTotalMl / 1000).toFixed(1)}L
              </div>
              <div className="text-muted-foreground text-xs">
                of {(targetMl / 1000).toFixed(1)}L
              </div>
            </div>
          </ProgressRing>
          {streak > 0 && (
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Flame size={16} className="text-accent" />
              {streak} day{streak === 1 ? '' : 's'} streak
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {WATER_QUICK_ADD_ML.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            disabled={addMutation.isPending}
            onClick={() => addMutation.mutate(amount)}
          >
            {amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
          </Button>
        ))}
        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Custom</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add custom amount</DialogTitle>
            </DialogHeader>
            <Input
              type="number"
              min={1}
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
            />
            <DialogFooter>
              <Button
                className="w-full"
                disabled={customAmount <= 0 || addMutation.isPending}
                onClick={() => addMutation.mutate(customAmount)}
              >
                Add {customAmount}ml
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <p className="text-foreground text-sm font-medium">Last 14 days</p>
          <div className="flex h-24 items-end gap-1.5">
            {[...dailyTotals].reverse().map((day) => (
              <div key={day.dateKey} className="flex h-full flex-1 flex-col items-end justify-end">
                <div
                  className="bg-primary w-full rounded-t-sm"
                  style={{ height: `${Math.max((day.totalMl / maxDayTotal) * 100, 2)}%` }}
                  title={`${day.dateKey}: ${day.totalMl}ml`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {todayLogs.length > 0 && (
        <Card>
          <CardContent className="space-y-2">
            <p className="text-foreground text-sm font-medium">Today&apos;s entries</p>
            {todayLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-center justify-between text-sm ${log.pending ? 'opacity-60' : ''}`}
              >
                <span className="text-muted-foreground">
                  {log.pending
                    ? 'Pending sync'
                    : new Date(log.loggedAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{log.amountMl}ml</span>
                  <button
                    type="button"
                    aria-label="Delete entry"
                    onClick={() => deleteMutation.mutate(log)}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
