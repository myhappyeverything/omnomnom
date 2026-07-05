import type { CountedItem } from '@/utils/analytics'
import { EmptyPlateIllustration } from '@/components/illustrations/EmptyPlateIllustration'

export function CountedList({ items, emptyText }: { items: CountedItem[]; emptyText: string }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <EmptyPlateIllustration size={56} />
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      </div>
    )
  }

  const maxCount = Math.max(...items.map((i) => i.count))

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-foreground">{item.label}</span>
            <span className="text-muted-foreground text-xs">{item.count}x</span>
          </div>
          <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-burnt-orange h-full rounded-full"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
