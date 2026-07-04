import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { createGoal } from '@/api/goals'
import { ApiError } from '@/api/client'
import { AccountStep } from './AccountStep'
import { GoalStep } from './GoalStep'
import { ReviewStep, type ReviewValues } from './ReviewStep'
import type { OnboardingAccountData, OnboardingGoalData } from './types'

type Step = 'account' | 'goal' | 'review'

const STEP_LABELS: Record<Step, string> = {
  account: 'Your details',
  goal: 'Your goal',
  review: 'Review targets',
}
const STEP_ORDER: Step[] = ['account', 'goal', 'review']

export function OnboardingPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('account')
  const [accountData, setAccountData] = useState<OnboardingAccountData | null>(null)
  const [goalData, setGoalData] = useState<OnboardingGoalData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFinish = async (values: ReviewValues, overridden: Record<string, boolean>) => {
    if (!accountData || !goalData) return
    setIsSubmitting(true)
    try {
      await register(accountData)
      await createGoal({
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
      navigate('/', { replace: true })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Something went wrong'
      toast.error(message)
      // Registration is what most plausibly fails (duplicate email, registration
      // closed) — send them back to fix it rather than stranding them on review.
      setStep('account')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center p-6">
      <div className="w-full max-w-sm space-y-6 py-8">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-semibold">Create your account</h1>
          <p className="text-muted-foreground mt-1 text-sm">{STEP_LABELS[step]}</p>
        </div>

        <div className="flex gap-1.5">
          {STEP_ORDER.map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                STEP_ORDER.indexOf(s) <= STEP_ORDER.indexOf(step) ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {step === 'account' && (
          <AccountStep
            defaultValues={accountData ?? {}}
            onNext={(data) => {
              setAccountData(data)
              setStep('goal')
            }}
          />
        )}

        {step === 'goal' && (
          <GoalStep
            defaultValues={goalData ?? {}}
            onNext={(data) => {
              setGoalData(data)
              setStep('review')
            }}
            onBack={() => setStep('account')}
          />
        )}

        {step === 'review' && accountData && goalData && (
          <ReviewStep
            accountData={accountData}
            goalData={goalData}
            onBack={() => setStep('goal')}
            onFinish={handleFinish}
            isSubmitting={isSubmitting}
          />
        )}

        {step === 'account' && (
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
