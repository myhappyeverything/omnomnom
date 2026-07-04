import { useId, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface ProgressRingProps {
  /** 0–100+; values over 100 are clamped for the ring but can still be read from children. */
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  trackClassName?: string
  indicatorClassName?: string
  /** [from, to] CSS colors for a gradient stroke — takes priority over indicatorClassName. */
  gradient?: [string, string]
  children?: ReactNode
}

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 10,
  className,
  trackClassName,
  indicatorClassName,
  gradient,
  children,
}: ProgressRingProps) {
  const gradientId = useId()
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
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: gradient[0] }} />
              <stop offset="100%" style={{ stopColor: gradient[1] }} />
            </linearGradient>
          </defs>
        )}
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
          stroke={gradient ? `url(#${gradientId})` : undefined}
          className={cn(
            'transition-[stroke-dashoffset] duration-500 ease-out',
            !gradient && (indicatorClassName ?? 'stroke-primary'),
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
