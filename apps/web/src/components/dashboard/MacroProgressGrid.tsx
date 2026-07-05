import { Progress } from '@/components/ui/progress'

interface MacroItem {
  label: string
  consumed: number
  target: number
  unit: string
}

// Each macro gets its own hue rather than four identical bars.
const MACRO_COLORS = ['sage', 'mustard', 'olive', 'water'] as const

export function MacroProgressGrid({
  protein,
  carbs,
  fat,
  fibre,
}: {
  protein: MacroItem
  carbs: MacroItem
  fat: MacroItem
  fibre: MacroItem
}) {
  const items = [protein, carbs, fat, fibre]

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      {items.map((item, index) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {item.label}
            </span>
            <span className="text-foreground text-sm tabular-nums">
              {Math.round(item.consumed)}
              <span className="text-muted-foreground">/{Math.round(item.target)}{item.unit}</span>
            </span>
          </div>
          <Progress
            value={item.target > 0 ? (item.consumed / item.target) * 100 : 0}
            color={MACRO_COLORS[index]}
          />
        </div>
      ))}
    </div>
  )
}
