import { useState } from 'react'
import { WATER_QUICK_ADD_ML } from '@omnomnom/shared'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WaterGlassIllustration } from '@/components/illustrations/WaterGlassIllustration'
import { cn } from '@/utils/cn'

const PRESET_FILL_PERCENT: Record<number, number> = {
  250: 30,
  500: 55,
  750: 80,
  1000: 100,
}

export function WaterAmountDialog({
  open,
  onOpenChange,
  onAdd,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (amountMl: number) => void
  isPending?: boolean
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState(200)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How much water?</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <WaterGlassIllustration size={64} fillPercent={hovered ? PRESET_FILL_PERCENT[hovered] : 15} />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {WATER_QUICK_ADD_ML.map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={isPending}
              onMouseEnter={() => setHovered(amount)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(amount)}
              onClick={() => onAdd(amount)}
              className={cn(
                'bg-surface-muted text-foreground hover:bg-sky-blue/20 rounded-full py-3 text-sm font-medium transition-colors active:scale-95 disabled:opacity-50',
              )}
            >
              {amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Input
            type="number"
            min={1}
            value={customAmount}
            onChange={(e) => setCustomAmount(Number(e.target.value))}
            aria-label="Custom amount in millilitres"
          />
          <span className="text-muted-foreground text-sm">ml</span>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            className="w-full"
            disabled={customAmount <= 0 || isPending}
            onClick={() => onAdd(customAmount)}
          >
            Add {customAmount}ml
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
