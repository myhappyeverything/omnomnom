import { NUTRITION_SCORE_BANDS, type NutritionScoreLabel } from '../constants.js'

/**
 * Today's Nutrition Score answers "how well did I nourish my body today?" —
 * a daily habit score, not a measure of overall health. Each metric is a
 * fixed point allocation (not a weighted percentage) so the total is always
 * literally the sum of what's shown on screen: 26 + 18 + 12 + 8 + 9 + 4 + 5
 * really does add up to 82, with no separate rounding step to explain away.
 */
export const NUTRITION_SCORE_POINTS = {
  calories: 30,
  protein: 25,
  fibre: 15,
  foodQuality: 10,
  consistency: 10,
  water: 5,
  loggingCompleteness: 5,
} as const

export type NutritionScoreMetric = keyof typeof NUTRITION_SCORE_POINTS

export interface NutritionScoreInput {
  caloriesConsumed: number
  calorieTarget: number
  proteinConsumedG: number
  proteinTargetG: number
  fibreConsumedG: number
  fibreTargetG: number
  waterConsumedMl: number
  waterTargetMl: number
  /** 0-100 — the AI's assessment of today's logged meals as a whole (see the api's assessFoodQuality). */
  foodQualityPercent: number
  /** 0-100 — a rolling 14-day habit-consistency percentage (see calculateConsistencyPercent). */
  consistencyPercent: number
  /** How many of the 4 meal types (breakfast/lunch/dinner/snack) have at least one item logged today. */
  mealTypesLoggedToday: number
}

export interface ScoreComponent {
  points: number
  maxPoints: number
}

export interface NutritionScoreBreakdown {
  score: number
  label: NutritionScoreLabel
  components: {
    calories: ScoreComponent
    protein: ScoreComponent
    fibre: ScoreComponent
    foodQuality: ScoreComponent
    consistency: ScoreComponent
    water: ScoreComponent
    loggingCompleteness: ScoreComponent
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Full marks within 10% of target either direction; falls off past that band.
 * Exported so the api's rolling 14-day consistency window can score each
 * lookback day's calories with the exact same curve as today's own score.
 */
export function scoreCaloriesPercent(consumed: number, target: number): number {
  if (target <= 0) return 100
  const deviation = Math.abs(consumed - target) / target
  if (deviation <= 0.1) return 100
  return clamp(100 - (deviation - 0.1) * 200, 0, 100)
}

/**
 * Meeting or exceeding the target is full marks — there's no downside to
 * extra protein/fibre/water. Exported for the same reason as above.
 */
export function scoreMeetOrExceedPercent(consumed: number, target: number): number {
  if (target <= 0) return 100
  return clamp((consumed / target) * 100, 0, 100)
}

function scoreLoggingCompleteness(mealTypesLoggedToday: number): number {
  return clamp((mealTypesLoggedToday / 4) * 100, 0, 100)
}

function toPoints(percent: number, maxPoints: number): number {
  return Math.round((clamp(percent, 0, 100) / 100) * maxPoints)
}

function labelForScore(score: number): NutritionScoreLabel {
  if (score >= NUTRITION_SCORE_BANDS.excellent.min) return NUTRITION_SCORE_BANDS.excellent.label
  if (score >= NUTRITION_SCORE_BANDS.good.min) return NUTRITION_SCORE_BANDS.good.label
  if (score >= NUTRITION_SCORE_BANDS.fair.min) return NUTRITION_SCORE_BANDS.fair.label
  return NUTRITION_SCORE_BANDS.needsImprovement.label
}

export function calculateNutritionScore(input: NutritionScoreInput): NutritionScoreBreakdown {
  const percents: Record<NutritionScoreMetric, number> = {
    calories: scoreCaloriesPercent(input.caloriesConsumed, input.calorieTarget),
    protein: scoreMeetOrExceedPercent(input.proteinConsumedG, input.proteinTargetG),
    fibre: scoreMeetOrExceedPercent(input.fibreConsumedG, input.fibreTargetG),
    foodQuality: clamp(input.foodQualityPercent, 0, 100),
    consistency: clamp(input.consistencyPercent, 0, 100),
    water: scoreMeetOrExceedPercent(input.waterConsumedMl, input.waterTargetMl),
    loggingCompleteness: scoreLoggingCompleteness(input.mealTypesLoggedToday),
  }

  const components = Object.fromEntries(
    Object.entries(percents).map(([key, percent]) => {
      const maxPoints = NUTRITION_SCORE_POINTS[key as NutritionScoreMetric]
      return [key, { points: toPoints(percent, maxPoints), maxPoints }]
    }),
  ) as NutritionScoreBreakdown['components']

  // The total is the sum of the points actually shown, never a separately
  // rounded weighted average — those can silently disagree by a point.
  const score = Object.values(components).reduce((sum, component) => sum + component.points, 0)

  return { score, label: labelForScore(score), components }
}

export interface DailyHabitSnapshot {
  caloriesPercent: number
  proteinPercent: number
  fibrePercent: number
  mealsLoggedPercent: number
  /** null when there's nothing to grade (no meals that day) — excluded from that day's average rather than counted as 0. */
  foodQualityPercent: number | null
}

/**
 * Healthy Consistency, rolling over (up to) the last 14 days: each day's
 * habit dimensions are averaged together, then those daily averages are
 * averaged across the window. Deliberately a smooth average rather than a
 * pass/fail streak — one rough day barely moves it, matching "reward
 * sustainable habits rather than perfection."
 */
export function calculateConsistencyPercent(days: DailyHabitSnapshot[]): number {
  if (days.length === 0) return 100 // Not enough history yet — treated as neutral, not penalized.

  const perDayAverages = days.map((day) => {
    const values = [
      day.caloriesPercent,
      day.proteinPercent,
      day.fibrePercent,
      day.mealsLoggedPercent,
    ]
    if (day.foodQualityPercent !== null) values.push(day.foodQualityPercent)
    return values.reduce((sum, v) => sum + v, 0) / values.length
  })

  return clamp(
    perDayAverages.reduce((sum, v) => sum + v, 0) / perDayAverages.length,
    0,
    100,
  )
}
