import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { CreateCustomFoodInput } from '@omnomnom/shared'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CustomFoodFormFields({
  register,
  errors,
}: {
  register: UseFormRegister<CreateCustomFoodInput>
  errors: FieldErrors<CreateCustomFoodInput>
}) {
  return (
    <>
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
    </>
  )
}
