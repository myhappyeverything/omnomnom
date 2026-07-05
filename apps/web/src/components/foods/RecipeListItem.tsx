import type { RecipeRecord } from '@omnomnom/shared'

export function RecipeListItem({
  recipe,
  onSelect,
}: {
  recipe: RecipeRecord
  onSelect: (recipe: RecipeRecord) => void
}) {
  return (
    <button type="button" onClick={() => onSelect(recipe)} className="w-full py-3 text-left">
      <p className="text-foreground font-medium">{recipe.name}</p>
      <p className="text-muted-foreground text-xs">
        {recipe.servings} serving{recipe.servings === 1 ? '' : 's'} ·{' '}
        {Math.round(recipe.caloriesPerServing)} kcal/serving
      </p>
      <p className="text-muted-foreground mt-0.5 text-xs">
        P {Math.round(recipe.proteinGPerServing)}g · C {Math.round(recipe.carbsGPerServing)}g · F{' '}
        {Math.round(recipe.fatGPerServing)}g
      </p>
    </button>
  )
}
