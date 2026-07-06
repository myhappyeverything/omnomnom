import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { WaterGlassIllustration } from '@/components/illustrations/WaterGlassIllustration'

const GLASS_COUNT = 8

export function WaterCard({ consumedMl, targetMl }: { consumedMl: number; targetMl: number }) {
  const navigate = useNavigate()
  const perGlassMl = targetMl / GLASS_COUNT
  const filledGlasses = perGlassMl > 0 ? Math.floor(consumedMl / perGlassMl) : 0

  return (
    <button
      type="button"
      onClick={() => navigate('/analytics?tab=water')}
      className="w-full text-left"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <WaterGlassIllustration fillPercent={100} size={22} />
          <div>
            <p className="text-foreground text-sm font-semibold">Water</p>
            <p className="text-muted-foreground text-xs">
              {filledGlasses} of {GLASS_COUNT} glasses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs">
            {(consumedMl / 1000).toFixed(1)}L / {(targetMl / 1000).toFixed(1)}L
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {Array.from({ length: GLASS_COUNT }, (_, index) => {
          const glassAmount = Math.min(Math.max(consumedMl - index * perGlassMl, 0), perGlassMl)
          const fillPercent = perGlassMl > 0 ? (glassAmount / perGlassMl) * 100 : 0
          return <WaterGlassIllustration key={index} fillPercent={fillPercent} size={20} />
        })}
      </div>
    </button>
  )
}
