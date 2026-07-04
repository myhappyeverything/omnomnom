import { useMemo, useState } from 'react'
import { calculateGoalPlan, type GoalPlan } from '@purple/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OnboardingAccountData, OnboardingGoalData } from './types'

export interface ReviewValues {
  bmr: number
  tdee: number
  calorieTarget: number
  proteinTargetG: number
  fatTargetG: number
  carbsTargetG: number
  fibreTargetG: number
  waterTargetMl: number
}

interface FieldConfig {
  key: keyof Omit<ReviewValues, 'bmr' | 'tdee'>
  label: string
  unit: string
  step?: string
}

const FIELDS: FieldConfig[] = [
  { key: 'calorieTarget', label: 'Daily calories', unit: 'kcal' },
  { key: 'proteinTargetG', label: 'Protein', unit: 'g' },
  { key: 'carbsTargetG', label: 'Carbohydrates', unit: 'g' },
  { key: 'fatTargetG', label: 'Fat', unit: 'g' },
  { key: 'fibreTargetG', label: 'Fibre', unit: 'g' },
  { key: 'waterTargetMl', label: 'Water', unit: 'ml', step: '50' },
]

export function ReviewStep({
  accountData,
  goalData,
  onBack,
  onFinish,
  isSubmitting,
}: {
  accountData: OnboardingAccountData
  goalData: OnboardingGoalData
  onBack: () => void
  onFinish: (values: ReviewValues, overridden: Record<string, boolean>) => void
  isSubmitting: boolean
}) {
  const plan = useMemo<GoalPlan>(
    () =>
      calculateGoalPlan({
        sex: accountData.sex,
        dateOfBirth: accountData.dateOfBirth,
        heightCm: accountData.heightCm,
        currentWeightKg: accountData.currentWeightKg,
        targetWeightKg: goalData.targetWeightKg,
        goalType: goalData.goalType,
        activityLevel: goalData.activityLevel,
        targetDuration: goalData.targetDuration,
        customEndDate: goalData.customEndDate,
      }),
    [accountData, goalData],
  )

  const [values, setValues] = useState<ReviewValues>({ ...plan })

  const update = (key: FieldConfig['key'], raw: string) => {
    const num = Number(raw)
    if (Number.isNaN(num)) return
    setValues((prev) => ({ ...prev, [key]: num }))
  }

  const isOverridden = (key: FieldConfig['key']) => values[key] !== plan[key]

  const handleSubmit = () => {
    const overridden = Object.fromEntries(FIELDS.map((f) => [f.key, isOverridden(f.key)]))
    onFinish(values, overridden)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-card border-border bg-surface-muted text-muted-foreground border p-4 text-sm">
        Based on your details, your maintenance calories (TDEE) are{' '}
        <span className="text-foreground font-medium">{plan.tdee.toLocaleString()} kcal/day</span>.
        Every value below is editable — change anything that doesn&apos;t fit.
      </div>

      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, unit, step }) => (
          <div key={key} className="grid gap-1.5">
            <Label htmlFor={key} className="flex items-center gap-1.5">
              {label}
              {isOverridden(key) && (
                <span className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                  edited
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                id={key}
                type="number"
                step={step ?? '1'}
                value={values[key]}
                onChange={(event) => update(key, event.target.value)}
                className="pr-12"
              />
              <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs">
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Setting up…' : 'Finish'}
        </Button>
      </div>
    </div>
  )
}
