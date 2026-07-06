import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, ImageUp } from 'lucide-react'
import {
  createCustomFoodSchema,
  MEAL_TYPE_VALUES,
  type CreateCustomFoodInput,
  type MealType,
} from '@omnomnom/shared'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomFoodFormFields } from '@/components/foods/CustomFoodFormFields'
import { compressImage } from '@/utils/imageCompression'
import { analyzeLabel } from '@/api/ai'
import { createCustomFood } from '@/api/foods'
import { createMeal } from '@/api/meals'
import { ApiError } from '@/api/client'
import { inferMealTypeFromTime } from '@/utils/mealType'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

type Stage = 'capture' | 'analyzing' | 'review'

export function ScanLabelPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [mealType, setMealType] = useState<MealType>(
    (searchParams.get('meal') as MealType | null) ?? inferMealTypeFromTime(),
  )
  const [stage, setStage] = useState<Stage>('capture')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomFoodInput>({
    resolver: zodResolver(createCustomFoodSchema),
    defaultValues: { fibreG: 0 },
  })

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      const { base64, mimeType } = await compressImage(file)
      return analyzeLabel({ imageBase64: base64, mimeType })
    },
    onSuccess: (result) => {
      reset({
        name: result.name ?? '',
        brand: result.brand ?? undefined,
        servingSize: result.servingSize ?? 100,
        servingUnit: result.servingUnit ?? 'g',
        calories: result.calories ?? 0,
        proteinG: result.proteinG ?? 0,
        carbsG: result.carbsG ?? 0,
        fatG: result.fatG ?? 0,
        fibreG: result.fibreG ?? 0,
      })
      setStage('review')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not read that label')
      setStage('capture')
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: CreateCustomFoodInput) => {
      const food = await createCustomFood(data)
      await createMeal({
        mealType,
        loggedAt: new Date().toISOString(),
        items: [{ foodId: food.id, quantity: food.servingSize, unit: food.servingUnit }],
      })
      return food
    },
    onSuccess: (food) => {
      queryClient.invalidateQueries({ queryKey: ['foods'] })
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      toast.success(`${food.name} added to ${mealType}`)
      navigate('/dashboard')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not save this food')
    },
  })

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setStage('analyzing')
    analyzeMutation.mutate(file)
  }

  if (stage === 'capture') {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Scan a label</h1>
        <p className="text-muted-foreground text-center text-sm">
          Take or upload a photo of the nutrition facts label — we&apos;ll fill in the numbers for
          you to check.
        </p>
        <div className="grid w-full max-w-xs grid-cols-1 gap-3">
          <Button onClick={() => cameraInputRef.current?.click()}>
            <Camera size={18} />
            Take photo
          </Button>
          <Button variant="secondary" onClick={() => galleryInputRef.current?.click()}>
            <ImageUp size={18} />
            Choose from gallery
          </Button>
        </div>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0])}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0])}
        />
      </div>
    )
  }

  if (stage === 'analyzing') {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Selected nutrition label"
            className="rounded-card h-48 w-48 object-cover"
          />
        )}
        <div
          className="border-border border-t-primary size-8 animate-spin rounded-full border-2"
          role="status"
          aria-label="Reading label"
        />
        <p className="text-muted-foreground text-sm">Reading the label…</p>
      </div>
    )
  }

  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="text-foreground mb-2 text-3xl font-bold tracking-tight">Check the numbers</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Fix anything we misread, then save — it'll log this and save it for next time.
      </p>

      <div className="mb-6 flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Logging to</span>
        <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEAL_TYPE_VALUES.map((type) => (
              <SelectItem key={type} value={type}>
                {MEAL_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <form
        onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
        className="space-y-4"
        noValidate
      >
        <CustomFoodFormFields register={register} errors={errors} />
        <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : `Add to ${mealType}`}
        </Button>
      </form>
    </div>
  )
}
