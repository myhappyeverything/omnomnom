import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { registerSchema } from '@omnomnom/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { OnboardingAccountData } from './types'

const accountStepSchema = registerSchema.extend({
  currentWeightKg: z.number().positive().max(500),
})

export function AccountStep({
  defaultValues,
  onNext,
}: {
  defaultValues: Partial<OnboardingAccountData>
  onNext: (data: OnboardingAccountData) => void
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingAccountData>({
    resolver: zodResolver(accountStepSchema),
    defaultValues,
  })

  const sex = watch('sex')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register('name')} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          aria-invalid={!!errors.dateOfBirth}
          {...register('dateOfBirth')}
        />
        {errors.dateOfBirth && (
          <p className="text-destructive text-sm">{errors.dateOfBirth.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label>Sex</Label>
        <RadioGroup
          value={sex}
          onValueChange={(value) => setValue('sex', value as OnboardingAccountData['sex'])}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="male" id="sex-male" />
            <Label htmlFor="sex-male" className="font-normal">
              Male
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="female" id="sex-female" />
            <Label htmlFor="sex-female" className="font-normal">
              Female
            </Label>
          </div>
        </RadioGroup>
        {errors.sex && <p className="text-destructive text-sm">{errors.sex.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="heightCm">Height (cm)</Label>
          <Input
            id="heightCm"
            type="number"
            step="0.1"
            aria-invalid={!!errors.heightCm}
            {...register('heightCm', { valueAsNumber: true })}
          />
          {errors.heightCm && <p className="text-destructive text-sm">{errors.heightCm.message}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="currentWeightKg">Current weight (kg)</Label>
          <Input
            id="currentWeightKg"
            type="number"
            step="0.1"
            aria-invalid={!!errors.currentWeightKg}
            {...register('currentWeightKg', { valueAsNumber: true })}
          />
          {errors.currentWeightKg && (
            <p className="text-destructive text-sm">{errors.currentWeightKg.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  )
}
