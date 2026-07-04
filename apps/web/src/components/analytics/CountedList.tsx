import type { CountedItem } from '@/utils/analytics'

export function CountedList({ items, emptyText }: { items: CountedItem[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>
  }

  const maxCount = Math.max(...items.map((i) => i.count))

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-foreground">{item.label}</span>
            <span className="text-muted-foreground text-xs">{item.count}x</span>
          </div>
          <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
