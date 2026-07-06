import { Star } from 'lucide-react'
import type { FoodRecord } from '@omnomnom/shared'
import { cn } from '@/utils/cn'

export function FoodListItem({
  food,
  onSelect,
  onToggleFavourite,
  showSavedBadge,
}: {
  food: FoodRecord
  onSelect: (food: FoodRecord) => void
  onToggleFavourite?: (food: FoodRecord) => void
  /** Search results mix live provider hits with already-saved foods — show a badge to tell them apart. Other tabs are all saved already, so it'd just be noise there. */
  showSavedBadge?: boolean
}) {
  return (
    <div className="flex items-center gap-2 py-3">
      <button type="button" onClick={() => onSelect(food)} className="min-w-0 flex-1 text-left">
        <p className="text-foreground truncate font-medium">
          {showSavedBadge && food.isLocal && (
            <Star
              size={12}
              className="fill-mustard text-mustard mr-1 inline-block"
              aria-label="Previously saved"
            />
          )}
          {food.name}
        </p>
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
          className="text-muted-foreground hover:text-mustard shrink-0 p-1.5"
        >
          <Star size={18} className={cn(food.isFavourite && 'fill-mustard text-mustard')} />
        </button>
      )}
    </div>
  )
}
