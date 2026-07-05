import { useEffect, useRef, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useAuth } from '@/context/AuthContext'
import { getGreeting } from '@/utils/date'
import { CalorieCard } from '@/components/dashboard/CalorieCard'
import { NutritionScoreCard } from '@/components/dashboard/NutritionScoreCard'
import { MacroProgressGrid } from '@/components/dashboard/MacroProgressGrid'
import { WaterCard } from '@/components/dashboard/WaterCard'
import { WeightCard } from '@/components/dashboard/WeightCard'
import { MealRows } from '@/components/dashboard/MealRows'
import { QuickAddSheet } from '@/components/dashboard/QuickAddSheet'
import { Divider } from '@/components/ui/divider'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardPage() {
  const {
    isLoading,
    goal,
    totals,
    todayMeals,
    waterTotalMl,
    currentWeightKg,
    weightTrendKgPerWeek,
    score,
  } = useDashboardData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [mascotTrigger, setMascotTrigger] = useState<'smile' | 'bounce' | null>(null)

  const previousMealCount = useRef<number | null>(null)
  useEffect(() => {
    if (previousMealCount.current !== null && todayMeals.length > previousMealCount.current) {
      setMascotTrigger('bounce')
      const timeout = setTimeout(() => setMascotTrigger(null), 500)
      return () => clearTimeout(timeout)
    }
    previousMealCount.current = todayMeals.length
  }, [todayMeals.length])

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-foreground text-xl font-semibold">No active goal</h1>
        <p className="text-muted-foreground text-sm">
          Something went wrong setting up your targets — contact support to finish setup.
        </p>
      </div>
    )
  }

  const firstName = user?.name.split(' ')[0]

  return (
    <div className="px-6 pt-8 pb-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">OmNomNom</h1>
          {firstName && (
            <p className="text-muted-foreground mt-1 text-sm">
              {getGreeting()}, {firstName} 👋
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/foods')}
          aria-label="Search foods"
          className="border-border text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full border transition-transform active:scale-95"
        >
          <Search size={18} />
        </button>
      </header>

      <CalorieCard
        consumed={totals.calories}
        target={goal.calorieTarget}
        mascotTrigger={mascotTrigger}
      />

      <Divider className="my-6" />

      {score && (
        <>
          <NutritionScoreCard breakdown={score} />
          <Divider className="my-6" />
        </>
      )}

      <MacroProgressGrid
        protein={{
          label: 'Protein',
          consumed: totals.protein,
          target: goal.proteinTargetG,
          unit: 'g',
        }}
        carbs={{ label: 'Carbs', consumed: totals.carbs, target: goal.carbsTargetG, unit: 'g' }}
        fat={{ label: 'Fat', consumed: totals.fat, target: goal.fatTargetG, unit: 'g' }}
        fibre={{ label: 'Fibre', consumed: totals.fibre, target: goal.fibreTargetG, unit: 'g' }}
      />

      <Divider className="my-6" />

      <WaterCard consumedMl={waterTotalMl} targetMl={goal.waterTargetMl} />

      <Divider className="my-6" />

      <MealRows meals={todayMeals} />

      <Divider className="my-6" />

      <WeightCard currentWeightKg={currentWeightKg} trendKgPerWeek={weightTrendKgPerWeek} />

      <FloatingActionButton aria-label="Quick add" onClick={() => setQuickAddOpen(true)}>
        <Plus size={24} />
      </FloatingActionButton>
      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  )
}
