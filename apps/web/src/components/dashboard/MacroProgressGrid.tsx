import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface MacroItem {
  label: string
  consumed: number
  target: number
  unit: string
}

// Each macro gets its own hue rather than four identical orange bars — makes
// the grid scannable at a glance and gives the card some visual variety.
const MACRO_COLORS = ['accent', 'warning', 'primary', 'info'] as const

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
    <Card>
      <CardContent className="grid grid-cols-2 gap-4">
        {items.map((item, index) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-foreground font-medium">{item.label}</span>
              <span className="text-muted-foreground text-xs">
                {Math.round(item.consumed)}/{Math.round(item.target)}
                {item.unit}
              </span>
            </div>
            <Progress
              value={item.target > 0 ? (item.consumed / item.target) * 100 : 0}
              color={MACRO_COLORS[index]}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
