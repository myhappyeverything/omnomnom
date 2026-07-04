import { Droplet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function WaterCard({ consumedMl, targetMl }: { consumedMl: number; targetMl: number }) {
  const navigate = useNavigate()
  const percent = targetMl > 0 ? (consumedMl / targetMl) * 100 : 0
  const remainingMl = Math.max(targetMl - consumedMl, 0)

  return (
    <button type="button" onClick={() => navigate('/water')} className="w-full text-left">
      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-foreground flex items-center gap-2 text-sm font-medium">
              <Droplet size={16} className="text-info" />
              Water
            </div>
            <span className="text-muted-foreground text-xs">
              {(consumedMl / 1000).toFixed(1)}L / {(targetMl / 1000).toFixed(1)}L
            </span>
          </div>
          <Progress value={percent} color="info" />
          {remainingMl > 0 && (
            <p className="text-muted-foreground text-xs">
              {(remainingMl / 1000).toFixed(1)}L to go
            </p>
          )}
        </CardContent>
      </Card>
    </button>
  )
}
