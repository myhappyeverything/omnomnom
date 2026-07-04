import { Star } from 'lucide-react'
import type { FoodRecord } from '@purple/shared'
import { cn } from '@/utils/cn'

export function FoodListItem({
  food,
  onSelect,
  onToggleFavourite,
}: {
  food: FoodRecord
  onSelect: (food: FoodRecord) => void
  onToggleFavourite?: (food: FoodRecord) => void
}) {
  return (
    <div className="rounded-control border-border bg-surface flex items-center gap-2 border p-3">
      <button type="button" onClick={() => onSelect(food)} className="min-w-0 flex-1 text-left">
        <p className="text-foreground truncate text-sm font-medium">{food.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {food.brand ? `${food.brand} · ` : ''}
          {food.servingSize}
          {food.servingUnit} · {Math.round(food.calories)} kcal
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          P {Math.round(food.proteinG)}g · C {Math.round(food.carbsG)}g · F {Math.round(food.fatG)}g
        </p>
      </button>
      {onToggleFavourite && (
        <button
          type="button"
          aria-label={food.isFavourite ? 'Remove favourite' : 'Add favourite'}
          onClick={() => onToggleFavourite(food)}
          className="text-muted-foreground hover:text-primary shrink-0 p-1.5"
        >
          <Star size={18} className={cn(food.isFavourite && 'fill-primary text-primary')} />
        </button>
      )}
    </div>
  )
}
