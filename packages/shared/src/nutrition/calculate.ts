import {
  ACTIVITY_LEVEL_MULTIPLIERS,
  TARGET_DURATION_WEEKS,
  type ActivityLevel,
  type Goal,
  type Sex,
  type TargetDuration,
} from '../constants.js'

const KCAL_PER_KG_BODY_FAT = 7700
const MAX_DAILY_DEFICIT_KCAL = 1000 // ~0.9kg/week — the upper end of a commonly recommended safe rate of loss.
const MAX_DAILY_SURPLUS_KCAL = 500 // Lean-gain guidance; muscle synthesis can't use much more than this.
const MIN_CALORIE_FLOOR = 1200 // Absolute floor regardless of BMR, matching common clinical guidance.
const MIN_CARBS_G = 50 // Baseline for glycogen/brain function before other macros are trimmed.
const MIN_FAT_G = 20 // Baseline for hormone production before carbs absorb the rest of the budget.

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

/** Mifflin-St Jeor — the most broadly validated BMR equation for the general population. */
export function calculateBMR(input: {
  weightKg: number
  heightCm: number
  age: number
  sex: Sex
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age
  return Math.round(input.sex === 'male' ? base + 5 : base - 161)
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_LEVEL_MULTIPLIERS[activityLevel])
}

export function getDurationDays(targetDuration: TargetDuration, customEndDate?: string): number {
  if (targetDuration === 'custom') {
    if (!customEndDate) throw new Error('customEndDate is required when targetDuration is "custom"')
    const days = Math.ceil((new Date(customEndDate).getTime() - Date.now()) / 86_400_000)
    return Math.max(days, 1)
  }
  return TARGET_DURATION_WEEKS[targetDuration] * 7
}

export function calculateCalorieTarget(input: {
  tdee: number
  goalType: Goal
  currentWeightKg: number
  targetWeightKg: number
  totalDays: number
}): number {
  if (input.goalType === 'maintain') return input.tdee

  const totalWeightChangeKg = Math.abs(input.targetWeightKg - input.currentWeightKg)
  const totalKcalChange = totalWeightChangeKg * KCAL_PER_KG_BODY_FAT
  const dailyChange = totalKcalChange / input.totalDays

  if (input.goalType === 'lose_weight') {
    const clampedDeficit = Math.min(dailyChange, MAX_DAILY_DEFICIT_KCAL)
    return Math.max(Math.round(input.tdee - clampedDeficit), MIN_CALORIE_FLOOR)
  }

  // gain_weight
  const clampedSurplus = Math.min(dailyChange, MAX_DAILY_SURPLUS_KCAL)
  return Math.round(input.tdee + clampedSurplus)
}

export interface MacroTargets {
  proteinG: number
  fatG: number
  carbsG: number
  fibreG: number
}

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose_weight: 2.2, // Higher protein preserves lean mass in a deficit and aids satiety.
  maintain: 1.8,
  gain_weight: 2.0, // Supports muscle synthesis during a surplus.
}

const FAT_PERCENT_OF_CALORIES = 0.3

export function calculateMacroTargets(input: {
  calorieTarget: number
  currentWeightKg: number
  goalType: Goal
}): MacroTargets {
  const proteinG = Math.round(input.currentWeightKg * PROTEIN_G_PER_KG[input.goalType])
  let fatG = Math.round((input.calorieTarget * FAT_PERCENT_OF_CALORIES) / 9)
  let carbsG = Math.round((input.calorieTarget - proteinG * 4 - fatG * 9) / 4)

  if (carbsG < MIN_CARBS_G) {
    carbsG = MIN_CARBS_G
    fatG = Math.max(Math.round((input.calorieTarget - proteinG * 4 - carbsG * 4) / 9), MIN_FAT_G)
  }

  const fibreG = Math.round((input.calorieTarget / 1000) * 14)

  return { proteinG, fatG, carbsG, fibreG }
}

export function calculateWaterTargetMl(currentWeightKg: number): number {
  const raw = currentWeightKg * 35
  return Math.min(Math.max(Math.round(raw / 50) * 50, 1500), 4000)
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export function calculateHealthyBmiRange(heightCm: number): { minKg: number; maxKg: number } {
  const heightM = heightCm / 100
  return {
    minKg: Math.round(18.5 * heightM * heightM * 10) / 10,
    maxKg: Math.round(24.9 * heightM * heightM * 10) / 10,
  }
}

export interface GoalPlanInput {
  sex: Sex
  dateOfBirth: string
  heightCm: number
  currentWeightKg: number
  targetWeightKg: number
  goalType: Goal
  activityLevel: ActivityLevel
  targetDuration: TargetDuration
  customEndDate?: string
}

export interface GoalPlan {
  bmr: number
  tdee: number
  calorieTarget: number
  proteinTargetG: number
  fatTargetG: number
  carbsTargetG: number
  fibreTargetG: number
  waterTargetMl: number
}

/** The single entry point the onboarding UI calls to turn form answers into a full goal plan. */
export function calculateGoalPlan(input: GoalPlanInput): GoalPlan {
  const age = calculateAge(input.dateOfBirth)
  const bmr = calculateBMR({
    weightKg: input.currentWeightKg,
    heightCm: input.heightCm,
    age,
    sex: input.sex,
  })
  const tdee = calculateTDEE(bmr, input.activityLevel)
  const totalDays = getDurationDays(input.targetDuration, input.customEndDate)
  const calorieTarget = calculateCalorieTarget({
    tdee,
    goalType: input.goalType,
    currentWeightKg: input.currentWeightKg,
    targetWeightKg: input.targetWeightKg,
    totalDays,
  })
  const macros = calculateMacroTargets({
    calorieTarget,
    currentWeightKg: input.currentWeightKg,
    goalType: input.goalType,
  })
  const waterTargetMl = calculateWaterTargetMl(input.currentWeightKg)

  return {
    bmr,
    tdee,
    calorieTarget,
    proteinTargetG: macros.proteinG,
    fatTargetG: macros.fatG,
    carbsTargetG: macros.carbsG,
    fibreTargetG: macros.fibreG,
    waterTargetMl,
  }
}
