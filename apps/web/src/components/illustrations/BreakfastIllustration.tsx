import { cn } from '@/utils/cn'

/** Coffee cup + croissant — flat, minimal, warm line style. */
export function BreakfastIllustration({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      {/* Croissant */}
      <path
        d="M10 30 C10 20 20 14 28 17 C24 19 21 23 22 28 C27 26 31 27 33 31 C27 32 20 33 14 33 C11 33 10 32 10 30 Z"
        className="fill-burnt-orange"
      />
      <path
        d="M15 26 C17 23 20 21 23 20 M18 29 C21 27 24 26 27 26"
        fill="none"
        className="stroke-ink/30"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      {/* Coffee cup */}
      <path d="M30 26 h11 v6 a5.5 5.5 0 0 1 -5.5 5.5 h-0 a5.5 5.5 0 0 1 -5.5 -5.5 z" className="fill-ink" />
      <path
        d="M41 28 h2.5 a3 3 0 0 1 0 6 h-2.5"
        fill="none"
        className="stroke-ink"
        strokeWidth={2}
      />
      <path
        d="M33 21 q1.5 -2 0 -4 M36.5 21 q1.5 -2 0 -4"
        fill="none"
        className="stroke-mustard"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  )
}
