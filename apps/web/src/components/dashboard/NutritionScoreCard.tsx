import { useEffect, useRef, useState } from 'react'
import type { NutritionScoreBreakdown } from '@omnomnom/shared'
import { Progress } from '@/components/ui/progress'
import { Confetti } from '@/components/Confetti'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const COMPONENT_LABELS: Record<keyof NutritionScoreBreakdown['components'], string> = {
  calories: 'Calories',
  protein: 'Protein',
  fibre: 'Fibre',
  water: 'Water',
  consistency: 'Healthy consistency',
  mealTiming: 'Meal timing',
  weightTrend: 'Weight trend',
}

const LABEL_STYLES: Record<string, string> = {
  Excellent: 'text-primary',
  Good: 'text-accent',
  Fair: 'text-warning',
  'Needs Improvement': 'text-destructive',
}

const CONFETTI_THRESHOLD = 90

export function NutritionScoreCard({ breakdown }: { breakdown: NutritionScoreBreakdown }) {
  const [open, setOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const previousScore = useRef(breakdown.score)

  useEffect(() => {
    if (previousScore.current < CONFETTI_THRESHOLD && breakdown.score >= CONFETTI_THRESHOLD) {
      setShowConfetti(true)
      const timeout = setTimeout(() => setShowConfetti(false), 1000)
      return () => clearTimeout(timeout)
    }
    previousScore.current = breakdown.score
  }, [breakdown.score])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="relative w-full text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Nutrition score
            </p>
            <p className={`text-lg font-semibold ${LABEL_STYLES[breakdown.label]}`}>
              {breakdown.label}
            </p>
          </div>
          <div className="text-foreground text-3xl font-bold tabular-nums">{breakdown.score}</div>
        </div>
        {showConfetti && <Confetti />}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Score breakdown</DialogTitle>
            <DialogDescription>
              How today&apos;s {breakdown.score} was calculated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(
              Object.entries(breakdown.components) as [
                keyof NutritionScoreBreakdown['components'],
                NutritionScoreBreakdown['components'][keyof NutritionScoreBreakdown['components']],
              ][]
            ).map(([key, component]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-foreground font-medium">{COMPONENT_LABELS[key]}</span>
                  <span className="text-muted-foreground text-xs">
                    {component.score}/100 · {Math.round(component.weight * 100)}% weight
                  </span>
                </div>
                <Progress value={component.score} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
