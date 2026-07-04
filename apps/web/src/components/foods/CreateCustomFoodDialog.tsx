import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createCustomFoodSchema, type CreateCustomFoodInput } from '@purple/shared'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCustomFood } from '@/api/foods'
import { ApiError } from '@/api/client'

export function CreateCustomFoodDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomFoodInput>({
    resolver: zodResolver(createCustomFoodSchema),
    defaultValues: { fibreG: 0 },
  })

  const createMutation = useMutation({
    mutationFn: createCustomFood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] })
      toast.success('Custom food created')
      reset()
      setOpen(false)
      onCreated?.()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not create food')
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          Add custom food
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom food</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="servingSize">Serving size</Label>
              <Input
                id="servingSize"
                type="number"
                step="0.1"
                aria-invalid={!!errors.servingSize}
                {...register('servingSize', { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="servingUnit">Unit</Label>
              <Input
                id="servingUnit"
                placeholder="g, ml, piece..."
                aria-invalid={!!errors.servingUnit}
                {...register('servingUnit')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                step="1"
                {...register('calories', { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="proteinG">Protein (g)</Label>
              <Input
                id="proteinG"
                type="number"
                step="0.1"
                {...register('proteinG', { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="carbsG">Carbs (g)</Label>
              <Input
                id="carbsG"
                type="number"
                step="0.1"
                {...register('carbsG', { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fatG">Fat (g)</Label>
              <Input
                id="fatG"
                type="number"
                step="0.1"
                {...register('fatG', { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fibreG">Fibre (g)</Label>
              <Input
                id="fibreG"
                type="number"
                step="0.1"
                {...register('fibreG', { valueAsNumber: true })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Save food'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
