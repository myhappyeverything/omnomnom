import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

export function WeightCard({
  currentWeightKg,
  trendKgPerWeek,
}: {
  currentWeightKg: number | null
  trendKgPerWeek: number | null
}) {
  const navigate = useNavigate()

  return (
    <button type="button" onClick={() => navigate('/weight')} className="w-full text-left">
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Current weight</p>
            <p className="text-foreground text-2xl font-semibold">
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
                <TrendingUp size={18} className="text-accent" />
              ) : trendKgPerWeek < -0.05 ? (
                <TrendingDown size={18} className="text-accent" />
              ) : (
                <Minus size={18} />
              )}
              {Math.abs(trendKgPerWeek).toFixed(1)} kg/week
            </div>
          )}
        </CardContent>
      </Card>
    </button>
  )
}
