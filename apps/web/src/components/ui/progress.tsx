'use client'

import * as React from 'react'
import { Progress as ProgressPrimitive } from 'radix-ui'

import { cn } from '@/utils/cn'

const PROGRESS_COLORS = {
  primary: { track: 'bg-burnt-orange/15', fill: 'bg-burnt-orange' },
  sage: { track: 'bg-sage/15', fill: 'bg-sage' },
  olive: { track: 'bg-olive/15', fill: 'bg-olive' },
  mustard: { track: 'bg-mustard/15', fill: 'bg-mustard' },
  coral: { track: 'bg-dusty-coral/15', fill: 'bg-dusty-coral' },
  water: { track: 'bg-sky-blue/15', fill: 'bg-sky-blue' },
} as const

/** Thick rounded capsule — replaces the old thin generic bar. Sparkles
 * briefly on reaching 100%, shifts to a warm overflow tone past it. */
function Progress({
  className,
  value,
  color = 'primary',
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  color?: keyof typeof PROGRESS_COLORS
}) {
  const clamped = Math.min(100, Math.max(0, value ?? 0))
  const isComplete = clamped >= 100
  const isOverflowing = (value ?? 0) > 100
  const { track, fill } = PROGRESS_COLORS[color]

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(track, 'relative h-3 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          isOverflowing ? 'bg-terracotta' : fill,
          'h-full w-full flex-1 rounded-full transition-transform duration-500 ease-out',
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
      {isComplete && (
        <span
          key={Math.round(value ?? 0)}
          aria-hidden="true"
          className="sparkle-pop pointer-events-none absolute top-1/2 right-0.5 -translate-y-1/2 text-[10px] leading-none"
        >
          ✨
        </span>
      )}
    </ProgressPrimitive.Root>
  )
}

export { Progress }
