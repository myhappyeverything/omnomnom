import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface ProgressRingProps {
  /** 0–100+; values over 100 are clamped for the ring but can still be read from children. */
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  trackClassName?: string
  indicatorClassName?: string
  children?: ReactNode
}

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 10,
  className,
  trackClassName,
  indicatorClassName,
  children,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('stroke-border', trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            'stroke-primary transition-[stroke-dashoffset] duration-500 ease-out',
            indicatorClassName,
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
