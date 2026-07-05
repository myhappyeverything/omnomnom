import type { ComponentProps } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export function FloatingActionButton({
  className,
  children,
  ...props
}: ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full',
        'bg-primary text-primary-foreground',
        'focus-visible:outline-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        className,
      )}
      style={{ boxShadow: 'var(--shadow-soft)' }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
