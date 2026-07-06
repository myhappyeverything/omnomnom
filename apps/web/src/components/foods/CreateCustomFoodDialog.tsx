import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createCustomFoodSchema, type CreateCustomFoodInput } from '@omnomnom/shared'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createCustomFood } from '@/api/foods'
import { ApiError } from '@/api/client'
import { CustomFoodFormFields } from './CustomFoodFormFields'

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
          <CustomFoodFormFields register={register} errors={errors} />

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
