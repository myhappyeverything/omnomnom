import { useEffect, useRef, useState } from 'react'
import { HelpCircle } from 'lucide-react'
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
import { ScoreHelpModal } from '@/components/dashboard/ScoreHelpModal'

const COMPONENT_LABELS: Record<keyof NutritionScoreBreakdown['components'], string> = {
  calories: 'Calories',
  protein: 'Protein',
  fibre: 'Fibre',
  foodQuality: 'Food Quality',
  consistency: 'Healthy Consistency',
  water: 'Water',
  loggingCompleteness: 'Logging Completeness',
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
  const [helpOpen, setHelpOpen] = useState(false)
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
      <div className="relative w-full">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => setOpen(true)} className="flex-1 text-left">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Today&apos;s Nutrition Score
            </p>
            <p className={`text-lg font-semibold ${LABEL_STYLES[breakdown.label]}`}>
              {breakdown.label}
            </p>
          </button>
          <button
            type="button"
            aria-label="How your nutrition score works"
            onClick={() => setHelpOpen(true)}
            className="text-muted-foreground hover:text-foreground shrink-0 p-1"
          >
            <HelpCircle size={16} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-foreground shrink-0 text-3xl font-bold tabular-nums"
          >
            {breakdown.score}
            <span className="text-muted-foreground text-base font-normal">/100</span>
          </button>
        </div>
        {showConfetti && <Confetti />}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Today&apos;s Nutrition Score</DialogTitle>
              <button
                type="button"
                aria-label="How your nutrition score works"
                onClick={() => setHelpOpen(true)}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <HelpCircle size={15} />
              </button>
            </div>
            <p className="text-foreground text-2xl font-bold tabular-nums">
              {breakdown.score} / 100 points
            </p>
            <DialogDescription>Here&apos;s where your points came from today.</DialogDescription>
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
                    {component.points} / {component.maxPoints} pts
                  </span>
                </div>
                <Progress value={(component.points / component.maxPoints) * 100} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ScoreHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  )
}
