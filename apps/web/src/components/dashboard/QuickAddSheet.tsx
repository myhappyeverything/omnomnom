import { Camera, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WATER_QUICK_ADD_ML, type MealType } from '@omnomnom/shared'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Divider } from '@/components/ui/divider'
import { BreakfastIllustration } from '@/components/illustrations/BreakfastIllustration'
import { LunchIllustration } from '@/components/illustrations/LunchIllustration'
import { DinnerIllustration } from '@/components/illustrations/DinnerIllustration'
import { SnackIllustration } from '@/components/illustrations/SnackIllustration'
import { createWaterLog } from '@/api/water'
import { ApiError } from '@/api/client'

const MEAL_OPTIONS: { type: MealType; label: string; Illustration: typeof BreakfastIllustration }[] = [
  { type: 'breakfast', label: 'Breakfast', Illustration: BreakfastIllustration },
  { type: 'lunch', label: 'Lunch', Illustration: LunchIllustration },
  { type: 'dinner', label: 'Dinner', Illustration: DinnerIllustration },
  { type: 'snack', label: 'Snack', Illustration: SnackIllustration },
]

export function QuickAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const addWaterMutation = useMutation({
    mutationFn: (amountMl: number) => createWaterLog({ amountMl }),
    onSuccess: (_data, amountMl) => {
      queryClient.invalidateQueries({ queryKey: ['water'] })
      toast.success(`${amountMl}ml logged`)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not log water')
    },
  })

  const goTo = (path: string) => {
    onOpenChange(false)
    navigate(path)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Quick add</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          <div>
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Log a meal
            </p>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_OPTIONS.map(({ type, label, Illustration }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => goTo(`/foods?meal=${type}`)}
                  className="hover:bg-surface-muted flex flex-col items-center gap-2 rounded-2xl p-3 text-xs transition-colors active:scale-95"
                >
                  <Illustration size={32} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Divider />

          <div>
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Add water
            </p>
            <div className="grid grid-cols-4 gap-2">
              {WATER_QUICK_ADD_ML.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={addWaterMutation.isPending}
                  onClick={() => addWaterMutation.mutate(amount)}
                  className="bg-surface-muted text-foreground hover:bg-sky-blue/20 rounded-full py-2.5 text-sm font-medium transition-colors active:scale-95 disabled:opacity-50"
                >
                  {amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
                </button>
              ))}
            </div>
          </div>

          <Divider />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => goTo('/foods')}
              className="bg-surface-muted text-foreground flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition-transform active:scale-95"
            >
              <Search size={16} />
              Search food
            </button>
            <button
              type="button"
              onClick={() => goTo('/log/photo')}
              className="bg-surface-muted text-foreground flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition-transform active:scale-95"
            >
              <Camera size={16} />
              Take photo
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
