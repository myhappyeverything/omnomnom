import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { MealType, RecipeRecord } from '@omnomnom/shared'
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

export function AddRecipeToMealDialog({
  recipe,
  mealType,
  onOpenChange,
  onLogged,
}: {
  recipe: RecipeRecord | null
  mealType: MealType
  onOpenChange: (open: boolean) => void
  onLogged: () => void
}) {
  const [servings, setServings] = useState(1)
  const queryClient = useQueryClient()

  const logMutation = useMutation({
    mutationFn: () => {
      if (!recipe) throw new Error('No recipe selected')
      return createMeal({
        mealType,
        loggedAt: new Date().toISOString(),
        items: [{ recipeId: recipe.id, quantity: servings, unit: 'serving' }],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      toast.success(`${recipe?.name} added to ${mealType}`)
      onLogged()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not log this recipe')
    },
  })

  return (
    <Dialog
      open={!!recipe}
      onOpenChange={(next) => {
        if (!next) setServings(1)
        onOpenChange(next)
      }}
    >
      <DialogContent>
        {recipe && (
          <>
            <DialogHeader>
              <DialogTitle>{recipe.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                min={0}
                step="0.5"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => logMutation.mutate()}
                disabled={servings <= 0 || logMutation.isPending}
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
