import { Card, CardContent } from '@/components/ui/card'
import { ProgressRing } from '@/components/ProgressRing'

export function CalorieCard({ consumed, target }: { consumed: number; target: number }) {
  const remaining = Math.round(target - consumed)
  const percent = target > 0 ? (consumed / target) * 100 : 0

  return (
    <Card>
      <CardContent className="flex items-center gap-6">
        <ProgressRing
          value={percent}
          size={104}
          strokeWidth={10}
          gradient={['var(--color-primary)', 'var(--color-secondary-500)']}
        >
          <div className="text-center">
            <div className="text-foreground text-lg font-semibold">{Math.round(consumed)}</div>
            <div className="text-muted-foreground text-[10px]">of {Math.round(target)}</div>
          </div>
        </ProgressRing>
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">
            {remaining >= 0 ? 'Remaining today' : 'Over target'}
          </p>
          <p className="text-foreground text-2xl font-semibold">
            {Math.abs(remaining).toLocaleString()}{' '}
            <span className="text-muted-foreground text-sm font-normal">kcal</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
