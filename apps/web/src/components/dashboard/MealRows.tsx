import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { MEAL_TYPE_VALUES, type MealRecord, type MealType } from '@omnomnom/shared'
import { Divider } from '@/components/ui/divider'
import { EmptyPlateIllustration } from '@/components/illustrations/EmptyPlateIllustration'
import { BreakfastIllustration } from '@/components/illustrations/BreakfastIllustration'
import { LunchIllustration } from '@/components/illustrations/LunchIllustration'
import { DinnerIllustration } from '@/components/illustrations/DinnerIllustration'
import { SnackIllustration } from '@/components/illustrations/SnackIllustration'

const MEAL_META: Record<
  MealType,
  { label: string; accent: string; Illustration: typeof BreakfastIllustration }
> = {
  breakfast: { label: 'Breakfast', accent: 'bg-breakfast', Illustration: BreakfastIllustration },
  lunch: { label: 'Lunch', accent: 'bg-lunch', Illustration: LunchIllustration },
  dinner: { label: 'Dinner', accent: 'bg-dinner', Illustration: DinnerIllustration },
  snack: { label: 'Snacks', accent: 'bg-snack', Illustration: SnackIllustration },
}

export function MealRows({ meals }: { meals: MealRecord[] }) {
  const navigate = useNavigate()

  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <EmptyPlateIllustration />
        <p className="text-muted-foreground text-sm">
          Nothing logged yet today — when you're ready.
        </p>
      </div>
    )
  }

  const caloriesByType = MEAL_TYPE_VALUES.reduce<Record<MealType, number>>(
    (acc, type) => {
      acc[type] = meals
        .filter((meal) => meal.mealType === type)
        .reduce((sum, meal) => sum + meal.totalCalories, 0)
      return acc
    },
    { breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
  )

  return (
    <div>
      {MEAL_TYPE_VALUES.map((type, index) => {
        const { label, accent, Illustration } = MEAL_META[type]
        const calories = caloriesByType[type]
        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {index > 0 && <Divider />}
            <div className="flex items-center gap-4 py-3.5">
              <span className={`h-10 w-1 shrink-0 rounded-full ${accent}`} aria-hidden="true" />
              <Illustration />
              <button
                type="button"
                onClick={() => navigate(`/foods?meal=${type}`)}
                className="flex flex-1 items-center justify-between text-left"
              >
                <span className="text-foreground text-lg font-semibold">{label}</span>
                <span className="text-muted-foreground text-sm">
                  {calories > 0 ? `${Math.round(calories)} kcal` : 'Not logged'}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Add ${label.toLowerCase()}`}
                onClick={() => navigate(`/foods?meal=${type}`)}
                className="border-border text-muted-foreground hover:border-primary hover:text-primary flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-95"
              >
                <Plus size={16} />
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
