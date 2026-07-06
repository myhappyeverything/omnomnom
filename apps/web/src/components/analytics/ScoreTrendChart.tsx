import type { DailyScoreSummary } from '@/api/nutritionScore'

export function ScoreTrendChart({ points }: { points: DailyScoreSummary[] }) {
  if (points.length === 0) {
    return (
      <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
        Not enough data yet.
      </div>
    )
  }

  return (
    <div className="flex h-24 items-end gap-[2px]">
      {points.map((point) => (
        <div key={point.dateKey} className="flex h-full flex-1 flex-col justify-end">
          <div
            className="bg-primary w-full rounded-t-sm"
            style={{ height: `${Math.max(point.score, 2)}%` }}
            title={`${point.dateKey}: ${point.score}`}
          />
        </div>
      ))}
    </div>
  )
}
