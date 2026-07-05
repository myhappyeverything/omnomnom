import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'
import mascotImage from '@/assets/omnomnom-mascot.png'

export interface MascotProps {
  className?: string
  size?: number
  /** 'bounce' plays once when a meal is logged. 'smile' is a no-op here — the artwork is already smiling. */
  trigger?: 'smile' | 'bounce' | null
}

/** The brand mascot artwork (same PNG as the app icon/landing page), with a small idle
 * breathing loop and a one-off bounce when a meal is logged. */
export function Mascot({ className, size = 96, trigger }: MascotProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.img
      src={mascotImage}
      alt=""
      width={size}
      height={size}
      className={cn('pointer-events-none select-none', className)}
      animate={
        prefersReducedMotion
          ? undefined
          : trigger === 'bounce'
            ? { y: [0, -10, 0] }
            : { scale: [1, 1.035, 1] }
      }
      transition={
        trigger === 'bounce'
          ? { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }
          : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
      }
    />
  )
}
