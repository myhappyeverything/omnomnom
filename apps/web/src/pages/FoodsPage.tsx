import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ScanLine } from 'lucide-react'
import type { FoodRecord, MealType, RecipeRecord } from '@omnomnom/shared'
import { MEAL_TYPE_VALUES } from '@omnomnom/shared'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { EmptyPlateIllustration } from '@/components/illustrations/EmptyPlateIllustration'
import { StarIllustration } from '@/components/illustrations/StarIllustration'
import {
  searchFoods,
  listRecentFoods,
  listFrequentFoods,
  listFavouriteFoods,
  addFavourite,
  removeFavourite,
  resolveFoodId,
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

function EmptyList({ text, illustration }: { text: string; illustration?: 'star' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      {illustration === 'star' ? (
        <StarIllustration size={56} />
      ) : (
        <EmptyPlateIllustration size={56} />
      )}
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  )
}

export function FoodsPage() {
  const navigate = useNavigate()
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
    mutationFn: async (food: FoodRecord) => {
      if (food.isFavourite) return removeFavourite(food.id)
      const foodId = await resolveFoodId(food)
      return addFavourite(foodId)
    },
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
    illustration?: 'star',
    showSavedBadge?: boolean,
  ) => {
    if (isLoading) return <p className="text-muted-foreground py-6 text-sm">Loading…</p>
    if (!foods || foods.length === 0) {
      return <EmptyList text={emptyText} illustration={illustration} />
    }
    return (
      <div className="divide-border divide-y">
        {foods.map((food) => (
          <FoodListItem
            key={food.id}
            food={food}
            onSelect={setSelectedFood}
            onToggleFavourite={(f) => favouriteMutation.mutate(f)}
            showSavedBadge={showSavedBadge}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="text-foreground mb-6 text-3xl font-bold tracking-tight">Foods</h1>

      <div className="mb-6 flex items-center gap-2">
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
        <TabsList variant="line" className="w-full justify-start gap-5 overflow-x-auto p-0">
          <TabsTrigger value="search" className="flex-none px-0">
            Search
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex-none px-0">
            Recent
          </TabsTrigger>
          <TabsTrigger value="favourites" className="flex-none px-0">
            Favs
          </TabsTrigger>
          <TabsTrigger value="frequent" className="flex-none px-0">
            Frequent
          </TabsTrigger>
          <TabsTrigger value="recipes" className="flex-none px-0">
            Recipes
          </TabsTrigger>
        </TabsList>

        <div className="border-border border-t" />

        <TabsContent value="search" className="space-y-3 pt-5">
          <Input
            placeholder="Search foods..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {debouncedQuery.length <= 1 ? (
            <p className="text-muted-foreground py-6 text-sm">Start typing to search foods.</p>
          ) : (
            renderFoodList(
              searchQuery.data,
              searchQuery.isLoading,
              'No foods found.',
              undefined,
              true,
            )
          )}
          <div className="grid grid-cols-2 gap-2">
            <CreateCustomFoodDialog />
            <Button variant="secondary" onClick={() => navigate(`/log/label?meal=${mealType}`)}>
              <ScanLine size={16} />
              Scan label
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="pt-5">
          {renderFoodList(recentQuery.data, recentQuery.isLoading, 'No recently logged foods yet.')}
        </TabsContent>

        <TabsContent value="favourites" className="pt-5">
          {renderFoodList(
            favouritesQuery.data,
            favouritesQuery.isLoading,
            'No favourites yet.',
            'star',
          )}
        </TabsContent>

        <TabsContent value="frequent" className="pt-5">
          {renderFoodList(
            frequentQuery.data,
            frequentQuery.isLoading,
            'No frequently logged foods yet.',
          )}
        </TabsContent>

        <TabsContent value="recipes" className="space-y-3 pt-5">
          {recipesQuery.isLoading ? (
            <p className="text-muted-foreground py-6 text-sm">Loading…</p>
          ) : (recipesQuery.data ?? []).length === 0 ? (
            <EmptyList text="No recipes yet." />
          ) : (
            <div className="divide-border divide-y">
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
