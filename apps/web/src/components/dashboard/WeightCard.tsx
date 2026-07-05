import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function WeightCard({
  currentWeightKg,
  trendKgPerWeek,
}: {
  currentWeightKg: number | null
  trendKgPerWeek: number | null
}) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/weight')}
      className="flex w-full items-center justify-between text-left"
    >
      <div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Current weight
        </p>
        <p className="text-foreground text-2xl font-bold">
          {currentWeightKg !== null ? (
            <>
              {currentWeightKg.toFixed(1)}{' '}
              <span className="text-muted-foreground text-sm font-normal">kg</span>
            </>
          ) : (
            <span className="text-muted-foreground text-base font-normal">No logs yet</span>
          )}
        </p>
      </div>
      {trendKgPerWeek !== null && (
        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          {trendKgPerWeek > 0.05 ? (
            <TrendingUp size={18} className="text-olive" />
          ) : trendKgPerWeek < -0.05 ? (
            <TrendingDown size={18} className="text-olive" />
          ) : (
            <Minus size={18} />
          )}
          {Math.abs(trendKgPerWeek).toFixed(1)} kg/week
        </div>
      )}
    </button>
  )
}
