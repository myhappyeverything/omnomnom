import { NUTRITION_SCORE_BANDS } from '@omnomnom/shared'
import { cn } from '@/utils/cn'

const BAND_RING_COLOR: Record<string, string> = {
  Excellent: 'var(--color-primary)',
  Good: 'var(--color-accent)',
  Fair: 'var(--color-warning)',
  'Needs Improvement': 'var(--color-destructive)',
}

function labelForScore(score: number): string {
  if (score >= NUTRITION_SCORE_BANDS.excellent.min) return NUTRITION_SCORE_BANDS.excellent.label
  if (score >= NUTRITION_SCORE_BANDS.good.min) return NUTRITION_SCORE_BANDS.good.label
  if (score >= NUTRITION_SCORE_BANDS.fair.min) return NUTRITION_SCORE_BANDS.fair.label
  return NUTRITION_SCORE_BANDS.needsImprovement.label
}

export function DayScoreRing({
  dayOfMonth,
  score,
  hasLog,
  isToday,
  isSelected,
  size = 36,
}: {
  dayOfMonth: number
  score: number
  hasLog: boolean
  isToday?: boolean
  isSelected?: boolean
  size?: number
}) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, score))
  const offset = circumference * (1 - (hasLog ? clamped : 0) / 100)
  const center = size / 2

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full',
        isSelected && 'ring-primary ring-2',
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        {hasLog && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            stroke={BAND_RING_COLOR[labelForScore(clamped)]}
          />
        )}
      </svg>
      <span
        className={cn(
          'absolute text-xs tabular-nums',
          hasLog ? 'text-foreground font-semibold' : 'text-muted-foreground',
          isToday && 'text-primary',
        )}
      >
        {dayOfMonth}
      </span>
    </div>
  )
}
