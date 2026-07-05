import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, ImageUp } from 'lucide-react'
import { MEAL_TYPE_VALUES, type MealType } from '@omnomnom/shared'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReviewItemRow, type DraftItem } from '@/components/photo/ReviewItemRow'
import { compressImage } from '@/utils/imageCompression'
import { inferMealTypeFromTime } from '@/utils/mealType'
import { analyzePhoto } from '@/api/ai'
import { createMeal } from '@/api/meals'
import { ApiError } from '@/api/client'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

type Stage = 'capture' | 'analyzing' | 'review'

export function PhotoLogPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mealType, setMealType] = useState<MealType>(
    (searchParams.get('meal') as MealType | null) ?? inferMealTypeFromTime(),
  )
  const [stage, setStage] = useState<Stage>('capture')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [r2Key, setR2Key] = useState<string | null>(null)
  const [items, setItems] = useState<DraftItem[]>([])
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      const { base64, mimeType } = await compressImage(file)
      return analyzePhoto({ imageBase64: base64, mimeType })
    },
    onSuccess: (result) => {
      setR2Key(result.r2Key)
      setItems(
        result.items.map((recognized) => ({
          recognized,
          matchedFood: recognized.matchedFood,
          quantity:
            recognized.matchedFood && recognized.matchedFood.servingUnit === 'g'
              ? recognized.estimatedQuantityGrams
              : (recognized.matchedFood?.servingSize ?? recognized.estimatedQuantityGrams),
        })),
      )
      setStage('review')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not analyze this photo')
      setStage('capture')
    },
  })

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setStage('analyzing')
    analyzeMutation.mutate(file)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const confirmedItems = items.filter((item) => item.matchedFood)
      return createMeal({
        mealType,
        loggedAt: new Date().toISOString(),
        photoR2Key: r2Key ?? undefined,
        items: confirmedItems.map((item) => ({
          foodId: item.matchedFood!.id,
          quantity: item.quantity,
          unit: item.matchedFood!.servingUnit,
          aiConfidence: item.recognized.confidence,
        })),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      toast.success('Meal logged')
      navigate('/')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not save this meal')
    },
  })

  const updateItem = (index: number, next: DraftItem) => {
    setItems((prev) => prev.map((item, i) => (i === index ? next : item)))
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const confirmedCount = items.filter((item) => item.matchedFood).length

  if (stage === 'capture') {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Log with a photo</h1>
        <p className="text-muted-foreground text-center text-sm">
          Take or upload a photo — we&apos;ll identify what&apos;s on the plate.
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
            alt="Selected meal"
            className="rounded-card h-48 w-48 object-cover"
          />
        )}
        <div
          className="border-border border-t-primary size-8 animate-spin rounded-full border-2"
          role="status"
          aria-label="Analyzing photo"
        />
        <p className="text-muted-foreground text-sm">Identifying what&apos;s on the plate…</p>
      </div>
    )
  }

  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="text-foreground mb-6 text-3xl font-bold tracking-tight">Review</h1>
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

      {items.length === 0 ? (
        <p className="text-muted-foreground p-4 text-sm">
          No foods were identified in that photo. Try another one, or search manually.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <ReviewItemRow
              key={`${item.recognized.name}-${index}`}
              item={item}
              onChange={(next) => updateItem(index, next)}
              onRemove={() => removeItem(index)}
            />
          ))}
        </div>
      )}

      <Button
        className="w-full"
        disabled={confirmedCount === 0 || saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending
          ? 'Saving…'
          : `Save ${confirmedCount} item${confirmedCount === 1 ? '' : 's'} to ${mealType}`}
      </Button>
    </div>
  )
}
