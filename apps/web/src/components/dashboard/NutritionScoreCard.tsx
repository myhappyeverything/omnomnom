import { useState } from 'react'
import type { NutritionScoreBreakdown } from '@omnomnom/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
  Fair: 'text-secondary-foreground',
  'Needs Improvement': 'text-destructive',
}

export function NutritionScoreCard({ breakdown }: { breakdown: NutritionScoreBreakdown }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Daily nutrition score</p>
              <p className={`text-2xl font-semibold ${LABEL_STYLES[breakdown.label]}`}>
                {breakdown.label}
              </p>
            </div>
            <div className="text-foreground text-3xl font-semibold">{breakdown.score}</div>
          </CardContent>
        </Card>
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
