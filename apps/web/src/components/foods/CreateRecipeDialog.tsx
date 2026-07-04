import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import type { FoodRecord } from '@purple/shared'
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
import { searchFoods } from '@/api/foods'
import { createRecipe } from '@/api/recipes'
import { ApiError } from '@/api/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

interface SelectedIngredient {
  food: FoodRecord
  quantity: number
}

export function CreateRecipeDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [servings, setServings] = useState(1)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<SelectedIngredient[]>([])
  const debouncedQuery = useDebouncedValue(query)
  const queryClient = useQueryClient()

  const searchQuery = useQuery({
    queryKey: ['foods', 'search', debouncedQuery],
    queryFn: () => searchFoods(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  })

  const reset = () => {
    setName('')
    setServings(1)
    setQuery('')
    setItems([])
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createRecipe({
        name,
        servings,
        items: items.map((item) => ({
          foodId: item.food.id,
          quantity: item.quantity,
          unit: item.food.servingUnit,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      toast.success('Recipe created')
      reset()
      setOpen(false)
      onCreated?.()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not create recipe')
    },
  })

  const addIngredient = (food: FoodRecord) => {
    if (items.some((item) => item.food.id === food.id)) return
    setItems((prev) => [...prev, { food, quantity: food.servingSize }])
    setQuery('')
  }

  const updateQuantity = (foodId: string, quantity: number) => {
    setItems((prev) => prev.map((item) => (item.food.id === foodId ? { ...item, quantity } : item)))
  }

  const removeIngredient = (foodId: string) => {
    setItems((prev) => prev.filter((item) => item.food.id !== foodId))
  }

  const canSubmit = name.trim().length > 0 && items.length > 0 && !createMutation.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          Create recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New recipe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label htmlFor="recipe-name">Name</Label>
              <Input id="recipe-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recipe-servings">Servings</Label>
              <Input
                id="recipe-servings"
                type="number"
                min={1}
                value={servings}
                onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recipe-search">Add ingredients</Label>
            <Input
              id="recipe-search"
              placeholder="Search foods..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {debouncedQuery.length > 1 && (
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {(searchQuery.data ?? []).map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => addIngredient(food)}
                    className="rounded-control border-border hover:bg-surface-muted w-full border p-2 text-left text-sm"
                  >
                    {food.name}{' '}
                    <span className="text-muted-foreground text-xs">
                      ({food.servingSize}
                      {food.servingUnit})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map(({ food, quantity }) => (
                <div
                  key={food.id}
                  className="rounded-control border-border flex items-center gap-2 border p-2"
                >
                  <span className="text-foreground min-w-0 flex-1 truncate text-sm">
                    {food.name}
                  </span>
                  <Input
                    type="number"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => updateQuantity(food.id, Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-muted-foreground text-xs">{food.servingUnit}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(food.id)}
                    aria-label={`Remove ${food.name}`}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button className="w-full" disabled={!canSubmit} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Saving…' : 'Save recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
