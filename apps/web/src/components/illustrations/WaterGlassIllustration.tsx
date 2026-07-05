import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface WaterGlassIllustrationProps {
  className?: string
  size?: number
  /** 0–100. Defaults to an empty outlined glass, used for "no water logged" empty states. */
  fillPercent?: number
}

/** A simple glass that fills with animated water — outlined when empty, tinted blue as it fills. */
export function WaterGlassIllustration({
  className,
  size = 32,
  fillPercent = 0,
}: WaterGlassIllustrationProps) {
  const clipId = useId()
  const prefersReducedMotion = useReducedMotion()
  const clamped = Math.min(100, Math.max(0, fillPercent))
  const isFilled = clamped > 0
  const waterTop = 10 + (30 - 10) * (1 - clamped / 100)

  return (
    <svg
      viewBox="0 0 24 32"
      width={size}
      height={(size * 32) / 24}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      <clipPath id={clipId}>
        <path d="M4 8 L20 8 L18 30 a2 2 0 0 1 -2 2 L8 32 a2 2 0 0 1 -2 -2 Z" />
      </clipPath>
      <path
        d="M4 8 L20 8 L18 30 a2 2 0 0 1 -2 2 L8 32 a2 2 0 0 1 -2 -2 Z"
        fill="none"
        className={isFilled ? 'stroke-sky-blue' : 'stroke-border'}
        strokeWidth={1.75}
      />
      <path
        d="M3.5 8 h17"
        className={isFilled ? 'stroke-sky-blue' : 'stroke-border'}
        strokeWidth={1.75}
      />
      <g clipPath={`url(#${clipId})`}>
        <motion.rect
          x={2}
          width={20}
          height={34}
          className="fill-sky-blue"
          fillOpacity={0.55}
          initial={false}
          animate={{ y: waterTop }}
          transition={
            prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
          }
        />
      </g>
    </svg>
  )
}
