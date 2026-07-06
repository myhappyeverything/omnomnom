import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const METRIC_EXPLANATIONS: { name: string; description: string }[] = [
  {
    name: 'Calories',
    description: "Measures how closely today's calorie intake matched your target.",
  },
  {
    name: 'Protein',
    description:
      'Rewards meeting your daily protein goal, helping support muscle maintenance, recovery and satiety.',
  },
  {
    name: 'Fibre',
    description:
      'Encourages adequate fibre intake for digestive health, fullness and long-term wellbeing.',
  },
  {
    name: 'Food Quality',
    description:
      "The overall nutritional quality of today's meals, rewarding balanced eating patterns and mostly whole, minimally processed foods. It considers factors like healthy fats, added sugars, food variety and the balance of meals throughout the day, not just individual foods.",
  },
  {
    name: 'Healthy Consistency',
    description:
      'Rewards maintaining healthy habits over time by looking at your recent nutrition history rather than just today.',
  },
  {
    name: 'Water',
    description: 'Tracks progress toward your daily hydration goal.',
  },
  {
    name: 'Logging Completeness',
    description:
      "Rewards fully logging your meals so your Nutrition Score accurately reflects your day.",
  },
]

export function ScoreHelpModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How Your Nutrition Score Works</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            This score isn&apos;t a measure of your overall health — it&apos;s a reflection of how
            well today&apos;s habits aligned with your nutrition goals.
          </p>

          {METRIC_EXPLANATIONS.map(({ name, description }) => (
            <div key={name} className="space-y-1">
              <p className="text-foreground font-semibold">{name}</p>
              <p className="text-muted-foreground">{description}</p>
            </div>
          ))}

          <p className="text-foreground border-border border-t pt-4 font-medium">
            The goal isn&apos;t to score 100 every day. A high Nutrition Score comes from
            consistently making balanced choices over time, not from being perfect.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
