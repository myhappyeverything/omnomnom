import { NUTRITION_SCORE_BANDS, type Goal, type NutritionScoreLabel } from '../constants.js'

export interface NutritionScoreWeights {
  calories: number
  protein: number
  fibre: number
  water: number
  consistency: number
  mealTiming: number
  weightTrend: number
}

/** Matches the spec's weighting exactly; pass a different object to `calculateNutritionScore`
 *  to experiment without touching the scoring logic itself. */
export const DEFAULT_NUTRITION_SCORE_WEIGHTS: NutritionScoreWeights = {
  calories: 0.3,
  protein: 0.25,
  fibre: 0.15,
  water: 0.1,
  consistency: 0.1,
  mealTiming: 0.05,
  weightTrend: 0.05,
}

export interface NutritionScoreInput {
  caloriesConsumed: number
  calorieTarget: number
  proteinConsumedG: number
  proteinTargetG: number
  fibreConsumedG: number
  fibreTargetG: number
  waterConsumedMl: number
  waterTargetMl: number
  /** How many of the last 7 days (including today) had at least one meal logged. */
  daysLoggedInLastWeek: number
  /** ISO timestamps of every meal logged today, used for the meal-timing heuristic. */
  mealTimestamps: string[]
  goalType: Goal
  /** Positive = gaining, negative = losing, null = not enough weigh-ins to compute a trend. */
  weightTrendKgPerWeek: number | null
}

export interface ScoreComponent {
  score: number
  weight: number
  contribution: number
}

export interface NutritionScoreBreakdown {
  score: number
  label: NutritionScoreLabel
  components: {
    calories: ScoreComponent
    protein: ScoreComponent
    fibre: ScoreComponent
    water: ScoreComponent
    consistency: ScoreComponent
    mealTiming: ScoreComponent
    weightTrend: ScoreComponent
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Full marks within 10% of target either direction; falls off past that band. */
function scoreCalories(consumed: number, target: number): number {
  if (target <= 0) return 100
  const deviation = Math.abs(consumed - target) / target
  if (deviation <= 0.1) return 100
  return clamp(100 - (deviation - 0.1) * 200, 0, 100)
}

/** Meeting or exceeding the target is full marks — there's no downside to extra protein/fibre/water. */
function scoreMeetOrExceed(consumed: number, target: number): number {
  if (target <= 0) return 100
  return clamp((consumed / target) * 100, 0, 100)
}

function scoreConsistency(daysLoggedInLastWeek: number): number {
  return clamp((daysLoggedInLastWeek / 7) * 100, 0, 100)
}

const MEAL_TIMING_WINDOWS = [
  { startHour: 5, endHour: 11 }, // morning
  { startHour: 11, endHour: 16 }, // midday
  { startHour: 16, endHour: 22 }, // evening
]

/** Rewards spreading meals across the day rather than skipping windows or eating everything at once. */
function scoreMealTiming(mealTimestamps: string[]): number {
  if (mealTimestamps.length === 0) return 0
  const hours = mealTimestamps.map((ts) => new Date(ts).getHours())
  const windowsHit = MEAL_TIMING_WINDOWS.filter(({ startHour, endHour }) =>
    hours.some((hour) => hour >= startHour && hour < endHour),
  ).length
  return (windowsHit / MEAL_TIMING_WINDOWS.length) * 100
}

/** Rewards trending toward the goal; no weigh-in data is treated as neutral, not penalized. */
function scoreWeightTrend(trendKgPerWeek: number | null, goalType: Goal): number {
  if (trendKgPerWeek === null) return 100

  if (goalType === 'maintain') {
    return clamp(100 - Math.abs(trendKgPerWeek) * 100, 0, 100)
  }
  if (goalType === 'lose_weight') {
    return trendKgPerWeek <= 0 ? 100 : clamp(100 - trendKgPerWeek * 100, 0, 100)
  }
  // gain_weight
  return trendKgPerWeek >= 0 ? 100 : clamp(100 + trendKgPerWeek * 100, 0, 100)
}

function labelForScore(score: number): NutritionScoreLabel {
  if (score >= NUTRITION_SCORE_BANDS.excellent.min) return NUTRITION_SCORE_BANDS.excellent.label
  if (score >= NUTRITION_SCORE_BANDS.good.min) return NUTRITION_SCORE_BANDS.good.label
  if (score >= NUTRITION_SCORE_BANDS.fair.min) return NUTRITION_SCORE_BANDS.fair.label
  return NUTRITION_SCORE_BANDS.needsImprovement.label
}

export function calculateNutritionScore(
  input: NutritionScoreInput,
  weights: NutritionScoreWeights = DEFAULT_NUTRITION_SCORE_WEIGHTS,
): NutritionScoreBreakdown {
  const rawScores = {
    calories: scoreCalories(input.caloriesConsumed, input.calorieTarget),
    protein: scoreMeetOrExceed(input.proteinConsumedG, input.proteinTargetG),
    fibre: scoreMeetOrExceed(input.fibreConsumedG, input.fibreTargetG),
    water: scoreMeetOrExceed(input.waterConsumedMl, input.waterTargetMl),
    consistency: scoreConsistency(input.daysLoggedInLastWeek),
    mealTiming: scoreMealTiming(input.mealTimestamps),
    weightTrend: scoreWeightTrend(input.weightTrendKgPerWeek, input.goalType),
  }

  const components = Object.fromEntries(
    Object.entries(rawScores).map(([key, score]) => {
      const weight = weights[key as keyof NutritionScoreWeights]
      return [key, { score: Math.round(score), weight, contribution: score * weight }]
    }),
  ) as NutritionScoreBreakdown['components']

  const score = Math.round(
    Object.values(components).reduce((sum, component) => sum + component.contribution, 0),
  )

  return { score, label: labelForScore(score), components }
}
