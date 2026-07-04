import { Camera, Cookie, Moon, Search, Soup, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WATER_QUICK_ADD_ML, type MealType } from '@omnomnom/shared'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { createWaterLog } from '@/api/water'
import { ApiError } from '@/api/client'

const MEAL_OPTIONS: { type: MealType; label: string; icon: typeof Sun }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: Sun },
  { type: 'lunch', label: 'Lunch', icon: Soup },
  { type: 'dinner', label: 'Dinner', icon: Moon },
  { type: 'snack', label: 'Snack', icon: Cookie },
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
            <p className="text-foreground mb-2 text-sm font-medium">Log a meal</p>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_OPTIONS.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => goTo(`/foods?meal=${type}`)}
                  className="rounded-control border-border text-foreground hover:bg-surface-muted flex flex-col items-center gap-1.5 border p-3 text-xs"
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-foreground mb-2 text-sm font-medium">Add water</p>
            <div className="grid grid-cols-4 gap-2">
              {WATER_QUICK_ADD_ML.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  disabled={addWaterMutation.isPending}
                  onClick={() => addWaterMutation.mutate(amount)}
                >
                  {amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => goTo('/foods')}>
              <Search size={16} />
              Search food
            </Button>
            <Button variant="secondary" onClick={() => goTo('/log/photo')}>
              <Camera size={16} />
              Take photo
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
