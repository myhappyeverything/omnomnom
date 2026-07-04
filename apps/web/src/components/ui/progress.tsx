'use client'

import * as React from 'react'
import { Progress as ProgressPrimitive } from 'radix-ui'

import { cn } from '@/utils/cn'

const PROGRESS_COLORS = {
  primary: 'bg-primary/20',
  secondary: 'bg-secondary-foreground/20',
  accent: 'bg-accent/20',
  info: 'bg-info/20',
  warning: 'bg-warning/20',
} as const

const PROGRESS_INDICATOR_COLORS = {
  primary: 'bg-primary',
  secondary: 'bg-secondary-foreground',
  accent: 'bg-accent',
  info: 'bg-info',
  warning: 'bg-warning',
} as const

function Progress({
  className,
  value,
  color = 'primary',
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  color?: keyof typeof PROGRESS_COLORS
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        PROGRESS_COLORS[color],
        'relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(PROGRESS_INDICATOR_COLORS[color], 'h-full w-full flex-1 transition-all')}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
