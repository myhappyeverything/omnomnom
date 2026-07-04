import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PublicUser } from '@omnomnom/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApiError } from '@/api/client'
import { createGoal, fetchActiveGoal, GOALS_ACTIVE_QUERY_KEY } from '@/api/goals'
import { listWeightLogs } from '@/api/weight'
import { GoalStep } from '@/pages/onboarding/GoalStep'
import { ReviewStep } from '@/pages/onboarding/ReviewStep'
import type { OnboardingGoalData } from '@/pages/onboarding/types'
import { ACTIVITY_LABELS, GOAL_LABELS } from '@/utils/goalLabels'

export function GoalCard({ user }: { user: PublicUser }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [step, setStep] = useState<'goal' | 'review'>('goal')
  const [goalData, setGoalData] = useState<OnboardingGoalData | null>(null)

  const goalQuery = useQuery({ queryKey: GOALS_ACTIVE_QUERY_KEY, queryFn: fetchActiveGoal })
  const latestWeightQuery = useQuery({
    queryKey: ['weight', 'latest'],
    queryFn: () => listWeightLogs(),
  })
  const latestWeightKg = latestWeightQuery.data?.[0]?.weightKg ?? null

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: (goal) => {
      queryClient.setQueryData(GOALS_ACTIVE_QUERY_KEY, goal)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Goal updated')
      setEditing(false)
      setStep('goal')
      setGoalData(null)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not update your goal')
    },
  })

  const goal = goalQuery.data
  if (!goal) return null

  function closeSheet(open: boolean) {
    setEditing(open)
    if (!open) {
      setStep('goal')
      setGoalData(null)
    }
  }

  const accountData =
    latestWeightKg !== null
      ? {
          sex: user.sex,
          dateOfBirth: user.dateOfBirth,
          heightCm: user.heightCm,
          currentWeightKg: latestWeightKg,
        }
      : null

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-foreground text-sm font-medium">Your goal</p>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit goal
          </Button>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Goal</dt>
            <dd className="text-foreground">{GOAL_LABELS[goal.goalType]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Target weight</dt>
            <dd className="text-foreground">{goal.targetWeightKg}kg</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground text-xs">Activity level</dt>
            <dd className="text-foreground">{ACTIVITY_LABELS[goal.activityLevel]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Daily calories</dt>
            <dd className="text-foreground">{goal.calorieTarget} kcal</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Water</dt>
            <dd className="text-foreground">{(goal.waterTargetMl / 1000).toFixed(1)}L</dd>
          </div>
        </dl>
      </CardContent>

      <Sheet open={editing} onOpenChange={closeSheet}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{step === 'goal' ? 'Edit goal' : 'Review targets'}</SheetTitle>
          </SheetHeader>

          <div className="px-4 pb-6">
            {step === 'goal' && (
              <GoalStep
                defaultValues={{
                  goalType: goal.goalType,
                  targetWeightKg: goal.targetWeightKg,
                  targetDuration: goal.targetDuration,
                  customEndDate: goal.customEndDate ?? undefined,
                  activityLevel: goal.activityLevel,
                }}
                onNext={(data) => {
                  setGoalData(data)
                  setStep('review')
                }}
                onBack={() => closeSheet(false)}
              />
            )}

            {step === 'review' && goalData && accountData && (
              <ReviewStep
                accountData={accountData}
                goalData={goalData}
                onBack={() => setStep('goal')}
                isSubmitting={createGoalMutation.isPending}
                onFinish={(values, overridden) => {
                  createGoalMutation.mutate({
                    goalType: goalData.goalType,
                    startingWeightKg: accountData.currentWeightKg,
                    targetWeightKg: goalData.targetWeightKg,
                    targetDuration: goalData.targetDuration,
                    customEndDate: goalData.customEndDate,
                    activityLevel: goalData.activityLevel,
                    bmr: values.bmr,
                    tdee: values.tdee,
                    calorieTarget: values.calorieTarget,
                    calorieTargetOverridden: overridden.calorieTarget ?? false,
                    proteinTargetG: values.proteinTargetG,
                    proteinTargetOverridden: overridden.proteinTargetG ?? false,
                    carbsTargetG: values.carbsTargetG,
                    carbsTargetOverridden: overridden.carbsTargetG ?? false,
                    fatTargetG: values.fatTargetG,
                    fatTargetOverridden: overridden.fatTargetG ?? false,
                    fibreTargetG: values.fibreTargetG,
                    fibreTargetOverridden: overridden.fibreTargetG ?? false,
                    waterTargetMl: values.waterTargetMl,
                    waterTargetOverridden: overridden.waterTargetMl ?? false,
                  })
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  )
}
