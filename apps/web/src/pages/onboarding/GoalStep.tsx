import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ACTIVITY_LEVEL_VALUES, GOAL_VALUES, TARGET_DURATION_VALUES } from '@omnomnom/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ACTIVITY_LABELS, DURATION_LABELS, GOAL_LABELS } from '@/utils/goalLabels'
import type { OnboardingGoalData } from './types'

const goalStepSchema = z
  .object({
    goalType: z.enum(GOAL_VALUES),
    targetWeightKg: z.number().positive().max(500),
    targetDuration: z.enum(TARGET_DURATION_VALUES),
    customEndDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    activityLevel: z.enum(ACTIVITY_LEVEL_VALUES),
  })
  .refine((data) => data.targetDuration !== 'custom' || !!data.customEndDate, {
    message: 'Pick a target date',
    path: ['customEndDate'],
  })

export function GoalStep({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues: Partial<OnboardingGoalData>
  onNext: (data: OnboardingGoalData) => void
  onBack: () => void
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingGoalData>({
    resolver: zodResolver(goalStepSchema),
    defaultValues: { goalType: 'maintain', targetDuration: '8_weeks', ...defaultValues },
  })

  const goalType = watch('goalType')
  const targetDuration = watch('targetDuration')
  const activityLevel = watch('activityLevel')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5" noValidate>
      <div className="grid gap-2">
        <Label>Goal</Label>
        <RadioGroup
          value={goalType}
          onValueChange={(value) => setValue('goalType', value as OnboardingGoalData['goalType'])}
          className="grid grid-cols-3 gap-2"
        >
          {GOAL_VALUES.map((value) => (
            <Label
              key={value}
              htmlFor={`goal-${value}`}
              className="rounded-control border-border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary has-[[data-state=checked]]:text-secondary-foreground flex cursor-pointer items-center justify-center gap-2 border px-2 py-2.5 text-sm font-normal"
            >
              <RadioGroupItem value={value} id={`goal-${value}`} className="sr-only" />
              {GOAL_LABELS[value]}
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="targetWeightKg">Target weight (kg)</Label>
        <Input
          id="targetWeightKg"
          type="number"
          step="0.1"
          aria-invalid={!!errors.targetWeightKg}
          {...register('targetWeightKg', { valueAsNumber: true })}
        />
        {errors.targetWeightKg && (
          <p className="text-destructive text-sm">{errors.targetWeightKg.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="targetDuration">Timeframe</Label>
        <Select
          value={targetDuration}
          onValueChange={(value) =>
            setValue('targetDuration', value as OnboardingGoalData['targetDuration'])
          }
        >
          <SelectTrigger id="targetDuration" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TARGET_DURATION_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {DURATION_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {targetDuration === 'custom' && (
        <div className="grid gap-2">
          <Label htmlFor="customEndDate">Target date</Label>
          <Input
            id="customEndDate"
            type="date"
            aria-invalid={!!errors.customEndDate}
            {...register('customEndDate')}
          />
          {errors.customEndDate && (
            <p className="text-destructive text-sm">{errors.customEndDate.message}</p>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="activityLevel">Activity level</Label>
        <Select
          value={activityLevel}
          onValueChange={(value) =>
            setValue('activityLevel', value as OnboardingGoalData['activityLevel'])
          }
        >
          <SelectTrigger id="activityLevel" className="w-full">
            <SelectValue placeholder="Select your activity level" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_LEVEL_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {ACTIVITY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.activityLevel && (
          <p className="text-destructive text-sm">{errors.activityLevel.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}
