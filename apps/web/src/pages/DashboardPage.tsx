import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { CalorieCard } from '@/components/dashboard/CalorieCard'
import { NutritionScoreCard } from '@/components/dashboard/NutritionScoreCard'
import { MacroProgressGrid } from '@/components/dashboard/MacroProgressGrid'
import { WaterCard } from '@/components/dashboard/WaterCard'
import { WeightCard } from '@/components/dashboard/WeightCard'
import { QuickAddSheet } from '@/components/dashboard/QuickAddSheet'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardPage() {
  const { isLoading, goal, totals, waterTotalMl, currentWeightKg, weightTrendKgPerWeek, score } =
    useDashboardData()
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="rounded-card h-28 w-full" />
        <Skeleton className="rounded-card h-20 w-full" />
        <Skeleton className="rounded-card h-40 w-full" />
        <Skeleton className="rounded-card h-24 w-full" />
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

  return (
    <div className="space-y-4 p-4">
      <CalorieCard consumed={totals.calories} target={goal.calorieTarget} />

      {score && <NutritionScoreCard breakdown={score} />}

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

      <WaterCard consumedMl={waterTotalMl} targetMl={goal.waterTargetMl} />

      <WeightCard currentWeightKg={currentWeightKg} trendKgPerWeek={weightTrendKgPerWeek} />

      <FloatingActionButton aria-label="Quick add" onClick={() => setQuickAddOpen(true)}>
        <Plus size={24} />
      </FloatingActionButton>
      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  )
}
