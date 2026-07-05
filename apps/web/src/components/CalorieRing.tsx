import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface CalorieRingProps {
  /** 0–100+; values over 100 are clamped for the ring but the fill still turns "overflow" colored. */
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  children?: ReactNode
}

export function CalorieRing({
  value,
  size = 240,
  strokeWidth = 18,
  className,
  children,
}: CalorieRingProps) {
  const prefersReducedMotion = useReducedMotion()
  const clamped = Math.min(100, Math.max(0, value))
  const isOverflowing = value > 100
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  const center = size / 2

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="calorie-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--color-burnt-orange)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--color-terracotta)' }} />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          stroke={isOverflowing ? 'var(--color-terracotta)' : 'url(#calorie-ring-gradient)'}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={
            prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
          }
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
