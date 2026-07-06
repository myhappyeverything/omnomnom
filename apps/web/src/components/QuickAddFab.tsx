import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Droplet, Plus, ScanLine, Search, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { createWaterLog } from '@/api/water'
import { ApiError } from '@/api/client'
import { WaterAmountDialog } from '@/components/WaterAmountDialog'
import { cn } from '@/utils/cn'

// A shallow arc above the trigger, widest options nearest horizontal, tallest
// nearest vertical — spread across a semicircle from ~155° to ~25° (measuring
// counter-clockwise from the positive x-axis, 90° being straight up).
const ARC_RADIUS = 92
const ARC_ANGLES_DEG = [155, 111, 69, 25]

function arcOffset(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: ARC_RADIUS * Math.cos(rad), y: -ARC_RADIUS * Math.sin(rad) }
}

interface FanOption {
  label: string
  icon: LucideIcon
  onSelect: () => void
}

export function QuickAddFab() {
  const [open, setOpen] = useState(false)
  const [waterDialogOpen, setWaterDialogOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const addWaterMutation = useMutation({
    mutationFn: (amountMl: number) => createWaterLog({ amountMl }),
    onSuccess: (_data, amountMl) => {
      queryClient.invalidateQueries({ queryKey: ['water'] })
      toast.success(`${amountMl}ml logged`)
      setWaterDialogOpen(false)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not log water')
    },
  })

  const goTo = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  const options: FanOption[] = [
    { label: 'Search', icon: Search, onSelect: () => goTo('/foods') },
    { label: 'Photo', icon: Camera, onSelect: () => goTo('/log/photo') },
    { label: 'Label', icon: ScanLine, onSelect: () => goTo('/log/label') },
    {
      label: 'Water',
      icon: Droplet,
      onSelect: () => {
        setOpen(false)
        setWaterDialogOpen(true)
      },
    },
  ]

  return (
    <>
      <WaterAmountDialog
        open={waterDialogOpen}
        onOpenChange={setWaterDialogOpen}
        onAdd={(amountMl) => addWaterMutation.mutate(amountMl)}
        isPending={addWaterMutation.isPending}
      />
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Close quick add"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-25 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 -top-4 z-30 flex justify-center">
        <AnimatePresence>
          {open &&
            options.map(({ label, icon: Icon, onSelect }, index) => {
              const { x, y } = arcOffset(ARC_ANGLES_DEG[index] ?? 90)
              return (
                <motion.button
                  key={label}
                  type="button"
                  onClick={onSelect}
                  aria-label={label}
                  className={cn(
                    'border-border bg-surface text-foreground absolute flex flex-col items-center gap-1 rounded-full border p-3',
                  )}
                  style={{ boxShadow: 'var(--shadow-soft)' }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  animate={{ x, y, opacity: 1, scale: 1 }}
                  exit={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26, delay: index * 0.03 }}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span className="absolute top-full mt-1 text-xs font-medium whitespace-nowrap">
                    {label}
                  </span>
                </motion.button>
              )
            })}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-label={open ? 'Close quick add' : 'Quick add'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className={cn(
            'border-border bg-primary text-primary-foreground relative flex size-14 items-center justify-center rounded-full border-2',
            'focus-visible:outline-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          )}
          style={{ boxShadow: 'var(--shadow-soft)' }}
        >
          <Plus size={24} />
        </motion.button>
      </div>
    </>
  )
}
