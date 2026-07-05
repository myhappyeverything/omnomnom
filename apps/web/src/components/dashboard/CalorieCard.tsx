import { CalorieRing } from '@/components/CalorieRing'
import { Mascot } from '@/components/illustrations/Mascot'
import { useCountUp } from '@/hooks/useCountUp'

const ENCOURAGEMENT = {
  remaining: "You've got this",
  over: 'Every day is a fresh start',
}

export function CalorieCard({
  consumed,
  target,
  mascotTrigger,
}: {
  consumed: number
  target: number
  mascotTrigger?: 'smile' | 'bounce' | null
}) {
  const remaining = Math.round(target - consumed)
  const percent = target > 0 ? (consumed / target) * 100 : 0
  const animatedRemaining = useCountUp(Math.abs(remaining))

  return (
    <div className="flex items-center gap-6">
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {remaining >= 0 ? 'Calories left' : 'Over target'}
        </p>
        <p className="text-foreground text-6xl font-bold tracking-tight tabular-nums">
          {Math.round(animatedRemaining).toLocaleString()}
        </p>
        <p className="text-muted-foreground text-sm">of {Math.round(target).toLocaleString()} kcal</p>
        <p className="text-primary pt-1 text-sm font-medium">
          {remaining >= 0 ? ENCOURAGEMENT.remaining : ENCOURAGEMENT.over} ♡
        </p>
      </div>
      <CalorieRing value={percent} size={148} strokeWidth={14} className="shrink-0">
        <Mascot size={76} trigger={mascotTrigger} />
      </CalorieRing>
    </div>
  )
}
