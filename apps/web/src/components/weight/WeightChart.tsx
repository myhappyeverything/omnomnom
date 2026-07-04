import { useId } from 'react'

export interface WeightChartPoint {
  loggedAt: string
  weightKg: number
}

const WIDTH = 320
const HEIGHT = 160
const PADDING_X = 8
const PADDING_Y = 16

export function WeightChart({
  points,
  targetWeightKg,
}: {
  points: WeightChartPoint[]
  targetWeightKg?: number
}) {
  const gradientId = useId()

  if (points.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        No weight logs in this range yet.
      </div>
    )
  }

  const weights = points.map((p) => p.weightKg)
  const values = targetWeightKg ? [...weights, targetWeightKg] : weights
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const toX = (index: number) =>
    points.length === 1
      ? WIDTH / 2
      : PADDING_X + (index / (points.length - 1)) * (WIDTH - PADDING_X * 2)
  const toY = (weight: number) =>
    HEIGHT - PADDING_Y - ((weight - min) / range) * (HEIGHT - PADDING_Y * 2)

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.weightKg)}`)
    .join(' ')
  const areaPath = `${linePath} L ${toX(points.length - 1)} ${HEIGHT} L ${toX(0)} ${HEIGHT} Z`
  const last = points[points.length - 1]!

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-40 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
        </linearGradient>
      </defs>

      {targetWeightKg !== undefined && (
        <line
          x1={PADDING_X}
          x2={WIDTH - PADDING_X}
          y1={toY(targetWeightKg)}
          y2={toY(targetWeightKg)}
          className="stroke-accent"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      )}

      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        className="stroke-primary"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={toX(points.length - 1)} cy={toY(last.weightKg)} r={4} className="fill-primary" />
    </svg>
  )
}
