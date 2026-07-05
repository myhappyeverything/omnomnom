import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface MascotProps {
  className?: string
  size?: number
  /** 'smile' plays once when the nutrition score improves; 'bounce' plays once when a meal is logged. */
  trigger?: 'smile' | 'bounce' | null
}

const BLINK_INTERVAL_MS = 4200

/** A small, simplified OmNomNom character — rounded orange blob, a little leaf, closed happy eyes.
 * Deliberately simpler than the full brand mascot artwork (used for the app icon/landing page) so it
 * reads calmly at a small animated size rather than competing with the surrounding numbers. */
export function Mascot({ className, size = 96, trigger }: MascotProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isBlinking, setIsBlinking] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) return
    const interval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 140)
    }, BLINK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [prefersReducedMotion])

  return (
    <motion.svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn('overflow-visible', className)}
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
    >
      {/* Leaves */}
      <path d="M60 16 C54 4 44 0 36 6 C42 14 50 17 60 16 Z" className="fill-olive" />
      <path d="M60 16 C66 4 76 0 84 6 C78 14 70 17 60 16 Z" className="fill-sage" />

      {/* Body */}
      <path
        d="M60 14 C92 14 106 44 101 74 C97 100 81 113 60 113 C39 113 23 100 19 74 C14 44 28 14 60 14 Z"
        className="fill-burnt-orange"
      />

      {/* Blush */}
      <ellipse cx="33" cy="80" rx="7" ry="4.5" className="fill-dusty-coral" opacity={0.55} />
      <ellipse cx="87" cy="80" rx="7" ry="4.5" className="fill-dusty-coral" opacity={0.55} />

      {/* Eyes — closed, happy arcs; morph to a near-flat line briefly to blink.
          (Deliberately not a scaleY transform: framer-motion's originX/originY
          pixel values are resolved against the rendered CSS size, not the
          viewBox's own units, so at any size other than 1:1 the eyes would
          scale from the wrong point and stretch off toward the edge.) */}
      <motion.path
        fill="none"
        className="stroke-ink"
        strokeWidth={4.5}
        strokeLinecap="round"
        animate={{ d: isBlinking ? 'M42 70 Q48 71 54 70' : 'M42 66 Q48 76 54 66' }}
        transition={{ duration: 0.1 }}
      />
      <motion.path
        fill="none"
        className="stroke-ink"
        strokeWidth={4.5}
        strokeLinecap="round"
        animate={{ d: isBlinking ? 'M66 70 Q72 71 78 70' : 'M66 66 Q72 76 78 66' }}
        transition={{ duration: 0.1 }}
      />

      {/* Mouth — widens for the 'smile' trigger */}
      <motion.path
        fill="none"
        className="stroke-ink"
        strokeWidth={4}
        strokeLinecap="round"
        animate={{ d: trigger === 'smile' ? 'M46 86 Q60 101 74 86' : 'M50 88 Q60 95 70 88' }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.svg>
  )
}
