import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { FoodRecord, MealType } from '@purple/shared'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createMeal } from '@/api/meals'
import { ApiError } from '@/api/client'

export function AddFoodToMealDialog({
  food,
  mealType,
  onOpenChange,
  onLogged,
}: {
  food: FoodRecord | null
  mealType: MealType
  onOpenChange: (open: boolean) => void
  onLogged: () => void
}) {
  const [quantity, setQuantity] = useState(food?.servingSize ?? 0)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (food) setQuantity(food.servingSize)
  }, [food])

  const ratio = food && quantity > 0 ? quantity / food.servingSize : 0

  const logMutation = useMutation({
    mutationFn: () => {
      if (!food) throw new Error('No food selected')
      return createMeal({
        mealType,
        loggedAt: new Date().toISOString(),
        items: [{ foodId: food.id, quantity, unit: food.servingUnit }],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      queryClient.invalidateQueries({ queryKey: ['foods', 'recent'] })
      queryClient.invalidateQueries({ queryKey: ['foods', 'frequent'] })
      toast.success(`${food?.name} added to ${mealType}`)
      onLogged()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not log this food')
    },
  })

  return (
    <Dialog open={!!food} onOpenChange={onOpenChange}>
      <DialogContent>
        {food && (
          <>
            <DialogHeader>
              <DialogTitle>{food.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity ({food.servingUnit})</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={0}
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <p className="text-foreground font-medium">{Math.round(food.calories * ratio)}</p>
                  <p className="text-muted-foreground text-xs">kcal</p>
                </div>
                <div>
                  <p className="text-foreground font-medium">
                    {Math.round(food.proteinG * ratio)}g
                  </p>
                  <p className="text-muted-foreground text-xs">protein</p>
                </div>
                <div>
                  <p className="text-foreground font-medium">{Math.round(food.carbsG * ratio)}g</p>
                  <p className="text-muted-foreground text-xs">carbs</p>
                </div>
                <div>
                  <p className="text-foreground font-medium">{Math.round(food.fatG * ratio)}g</p>
                  <p className="text-muted-foreground text-xs">fat</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => logMutation.mutate()}
                disabled={quantity <= 0 || logMutation.isPending}
                className="w-full"
              >
                {logMutation.isPending ? 'Adding…' : `Add to ${mealType}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
