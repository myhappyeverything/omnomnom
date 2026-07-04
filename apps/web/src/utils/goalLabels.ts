import type { ACTIVITY_LEVEL_VALUES, GOAL_VALUES, TARGET_DURATION_VALUES } from '@omnomnom/shared'

export const GOAL_LABELS: Record<(typeof GOAL_VALUES)[number], string> = {
  lose_weight: 'Lose weight',
  maintain: 'Maintain',
  gain_weight: 'Gain weight',
}

export const DURATION_LABELS: Record<(typeof TARGET_DURATION_VALUES)[number], string> = {
  '2_weeks': '2 weeks',
  '4_weeks': '4 weeks',
  '8_weeks': '8 weeks',
  '12_weeks': '12 weeks',
  custom: 'Custom date',
}

export const ACTIVITY_LABELS: Record<(typeof ACTIVITY_LEVEL_VALUES)[number], string> = {
  sedentary: 'Sedentary — little to no exercise',
  lightly_active: 'Lightly active — 1-3 days/week',
  moderately_active: 'Moderately active — 3-5 days/week',
  very_active: 'Very active — 6-7 days/week',
  extremely_active: 'Extremely active — physical job or 2x/day training',
}
