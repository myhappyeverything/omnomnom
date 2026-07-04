import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface MacroItem {
  label: string
  consumed: number
  target: number
  unit: string
}

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
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-foreground font-medium">{item.label}</span>
              <span className="text-muted-foreground text-xs">
                {Math.round(item.consumed)}/{Math.round(item.target)}
                {item.unit}
              </span>
            </div>
            <Progress value={item.target > 0 ? (item.consumed / item.target) * 100 : 0} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
