import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { FoodRecord, RecognizedFoodItem } from '@omnomnom/shared'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { searchFoods } from '@/api/foods'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

export interface DraftItem {
  recognized: RecognizedFoodItem
  matchedFood: FoodRecord | null
  quantity: number
}

export function ReviewItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: DraftItem
  onChange: (next: DraftItem) => void
  onRemove: () => void
}) {
  const [searchOpen, setSearchOpen] = useState(!item.matchedFood)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)

  const searchQuery = useQuery({
    queryKey: ['foods', 'search', debouncedQuery],
    queryFn: () => searchFoods(debouncedQuery),
    enabled: debouncedQuery.length > 1 && searchOpen,
  })

  const confidencePercent = Math.round(item.recognized.confidence * 100)

  const selectFood = (food: FoodRecord) => {
    const quantity =
      food.servingUnit === 'g' ? item.recognized.estimatedQuantityGrams : food.servingSize
    onChange({ ...item, matchedFood: food, quantity })
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <div className="rounded-card border-border bg-surface space-y-2 border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-foreground text-sm font-medium">{item.recognized.name}</p>
          <Badge variant={confidencePercent >= 70 ? 'default' : 'secondary'} className="mt-1">
            {confidencePercent}% confident
          </Badge>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.recognized.name}`}
          className="text-muted-foreground hover:text-destructive p-1"
        >
          <X size={16} />
        </button>
      </div>

      {item.matchedFood && !searchOpen ? (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm">{item.matchedFood.name}</p>
            <p className="text-muted-foreground text-xs">
              {Math.round(
                (item.matchedFood.calories * item.quantity) / item.matchedFood.servingSize,
              )}{' '}
              kcal
            </p>
          </div>
          <Input
            type="number"
            step="0.1"
            value={item.quantity}
            onChange={(e) => onChange({ ...item, quantity: Number(e.target.value) })}
            className="w-24"
          />
          <span className="text-muted-foreground text-xs">{item.matchedFood.servingUnit}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSearchOpen(true)}>
            Change
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Input
            placeholder="Search for a matching food..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {debouncedQuery.length > 1 && (
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {(searchQuery.data ?? []).map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => selectFood(food)}
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
      )}
    </div>
  )
}
