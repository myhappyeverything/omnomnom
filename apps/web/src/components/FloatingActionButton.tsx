import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function FloatingActionButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'fixed right-5 bottom-20 z-30 flex size-14 items-center justify-center rounded-full',
        'bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95',
        'focus-visible:outline-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
