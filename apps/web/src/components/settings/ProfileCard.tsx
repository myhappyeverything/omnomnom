import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PublicUser } from '@omnomnom/shared'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/api/client'
import { listWeightLogs, createWeightLog } from '@/api/weight'
import { useAuth } from '@/context/AuthContext'
import { calculateAge } from '@/utils/date'

export function ProfileCard({ user }: { user: PublicUser }) {
  const { updateProfile } = useAuth()
  const queryClient = useQueryClient()

  const latestWeightQuery = useQuery({
    queryKey: ['weight', 'latest'],
    queryFn: () => listWeightLogs(),
  })
  const latestWeightKg = latestWeightQuery.data?.[0]?.weightKg ?? null

  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth)
  const [heightCm, setHeightCm] = useState(String(user.heightCm))
  const [weightKg, setWeightKg] = useState('')

  useEffect(() => setDateOfBirth(user.dateOfBirth), [user.dateOfBirth])
  useEffect(() => setHeightCm(String(user.heightCm)), [user.heightCm])
  useEffect(() => {
    if (latestWeightKg !== null) setWeightKg(String(latestWeightKg))
  }, [latestWeightKg])

  async function handleDateOfBirthBlur() {
    if (dateOfBirth === user.dateOfBirth || !dateOfBirth) return
    try {
      await updateProfile({ dateOfBirth })
      toast.success('Date of birth updated')
    } catch (error) {
      setDateOfBirth(user.dateOfBirth)
      toast.error(error instanceof ApiError ? error.message : 'Could not update date of birth')
    }
  }

  async function handleHeightBlur() {
    const value = Number(heightCm)
    if (!Number.isFinite(value) || value === user.heightCm) return
    try {
      await updateProfile({ heightCm: value })
      toast.success('Height updated')
    } catch (error) {
      setHeightCm(String(user.heightCm))
      toast.error(error instanceof ApiError ? error.message : 'Could not update height')
    }
  }

  const logWeightMutation = useMutation({
    mutationFn: createWeightLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight'] })
      toast.success('Weight updated')
    },
    onError: (error) => {
      if (latestWeightKg !== null) setWeightKg(String(latestWeightKg))
      toast.error(error instanceof ApiError ? error.message : 'Could not update weight')
    },
  })

  function handleWeightBlur() {
    const value = Number(weightKg)
    if (!Number.isFinite(value) || value <= 0 || value === latestWeightKg) return
    logWeightMutation.mutate({ weightKg: value })
  }

  const age = calculateAge(user.dateOfBirth)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="dateOfBirth">
          Date of birth <span className="text-muted-foreground font-normal">· {age}y</span>
        </Label>
        <Input
          id="dateOfBirth"
          type="date"
          className="w-36"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          onBlur={() => void handleDateOfBirthBlur()}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="heightCm">Height (cm)</Label>
        <Input
          id="heightCm"
          type="number"
          inputMode="decimal"
          className="w-36"
          value={heightCm}
          onChange={(e) => setHeightCm(e.target.value)}
          onBlur={() => void handleHeightBlur()}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="weightKg">Current weight (kg)</Label>
        <Input
          id="weightKg"
          type="number"
          inputMode="decimal"
          className="w-36"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          onBlur={handleWeightBlur}
        />
      </div>
    </div>
  )
}
