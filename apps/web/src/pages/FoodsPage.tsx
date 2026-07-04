import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { FoodRecord, MealType, RecipeRecord } from '@purple/shared'
import { MEAL_TYPE_VALUES } from '@purple/shared'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FoodListItem } from '@/components/foods/FoodListItem'
import { RecipeListItem } from '@/components/foods/RecipeListItem'
import { AddFoodToMealDialog } from '@/components/foods/AddFoodToMealDialog'
import { AddRecipeToMealDialog } from '@/components/foods/AddRecipeToMealDialog'
import { CreateCustomFoodDialog } from '@/components/foods/CreateCustomFoodDialog'
import { CreateRecipeDialog } from '@/components/foods/CreateRecipeDialog'
import {
  searchFoods,
  listRecentFoods,
  listFrequentFoods,
  listFavouriteFoods,
  addFavourite,
  removeFavourite,
} from '@/api/foods'
import { listRecipes } from '@/api/recipes'
import { ApiError } from '@/api/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { inferMealTypeFromTime } from '@/utils/mealType'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export function FoodsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mealType = (searchParams.get('meal') as MealType | null) ?? inferMealTypeFromTime()
  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodRecord | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeRecord | null>(null)
  const debouncedQuery = useDebouncedValue(query)
  const queryClient = useQueryClient()

  const searchQuery = useQuery({
    queryKey: ['foods', 'search', debouncedQuery],
    queryFn: () => searchFoods(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  })
  const recentQuery = useQuery({ queryKey: ['foods', 'recent'], queryFn: listRecentFoods })
  const frequentQuery = useQuery({ queryKey: ['foods', 'frequent'], queryFn: listFrequentFoods })
  const favouritesQuery = useQuery({
    queryKey: ['foods', 'favourites'],
    queryFn: listFavouriteFoods,
  })
  const recipesQuery = useQuery({ queryKey: ['recipes'], queryFn: listRecipes })

  const favouriteMutation = useMutation({
    mutationFn: (food: FoodRecord) =>
      food.isFavourite ? removeFavourite(food.id) : addFavourite(food.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not update favourite')
    },
  })

  const setMealType = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('meal', value)
      return next
    })
  }

  const renderFoodList = (
    foods: FoodRecord[] | undefined,
    isLoading: boolean,
    emptyText: string,
  ) => {
    if (isLoading) return <p className="text-muted-foreground p-4 text-sm">Loading…</p>
    if (!foods || foods.length === 0) {
      return <p className="text-muted-foreground p-4 text-sm">{emptyText}</p>
    }
    return (
      <div className="space-y-2">
        {foods.map((food) => (
          <FoodListItem
            key={food.id}
            food={food}
            onSelect={setSelectedFood}
            onToggleFavourite={(f) => favouriteMutation.mutate(f)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Logging to</span>
        <Select value={mealType} onValueChange={setMealType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEAL_TYPE_VALUES.map((type) => (
              <SelectItem key={type} value={type}>
                {MEAL_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="favourites">Favs</TabsTrigger>
          <TabsTrigger value="frequent">Frequent</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-3">
          <Input
            placeholder="Search foods..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {debouncedQuery.length <= 1 ? (
            <p className="text-muted-foreground p-4 text-sm">Start typing to search foods.</p>
          ) : (
            renderFoodList(searchQuery.data, searchQuery.isLoading, 'No foods found.')
          )}
          <CreateCustomFoodDialog />
        </TabsContent>

        <TabsContent value="recent">
          {renderFoodList(recentQuery.data, recentQuery.isLoading, 'No recently logged foods yet.')}
        </TabsContent>

        <TabsContent value="favourites">
          {renderFoodList(favouritesQuery.data, favouritesQuery.isLoading, 'No favourites yet.')}
        </TabsContent>

        <TabsContent value="frequent">
          {renderFoodList(
            frequentQuery.data,
            frequentQuery.isLoading,
            'No frequently logged foods yet.',
          )}
        </TabsContent>

        <TabsContent value="recipes" className="space-y-3">
          {recipesQuery.isLoading ? (
            <p className="text-muted-foreground p-4 text-sm">Loading…</p>
          ) : (recipesQuery.data ?? []).length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">No recipes yet.</p>
          ) : (
            <div className="space-y-2">
              {recipesQuery.data!.map((recipe) => (
                <RecipeListItem key={recipe.id} recipe={recipe} onSelect={setSelectedRecipe} />
              ))}
            </div>
          )}
          <CreateRecipeDialog />
        </TabsContent>
      </Tabs>

      <AddFoodToMealDialog
        food={selectedFood}
        mealType={mealType}
        onOpenChange={(open) => !open && setSelectedFood(null)}
        onLogged={() => setSelectedFood(null)}
      />
      <AddRecipeToMealDialog
        recipe={selectedRecipe}
        mealType={mealType}
        onOpenChange={(open) => !open && setSelectedRecipe(null)}
        onLogged={() => setSelectedRecipe(null)}
      />
    </div>
  )
}
