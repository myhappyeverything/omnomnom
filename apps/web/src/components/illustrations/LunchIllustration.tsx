import { cn } from '@/utils/cn'

/** A simple sandwich — flat, minimal, warm line style. */
export function LunchIllustration({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      {/* Bottom bread */}
      <path d="M8 32 h32 l-3 5 a3 3 0 0 1 -2.6 1.5 h-20.8 a3 3 0 0 1 -2.6 -1.5 z" className="fill-mustard" />
      {/* Filling */}
      <rect x="9" y="27" width="30" height="5" rx="1.5" className="fill-sage" />
      <rect x="9.5" y="23" width="29" height="4" rx="1.5" className="fill-dusty-coral" />
      {/* Top bread (triangle-ish crust) */}
      <path d="M10 23 C10 15 16 10 24 10 C32 10 38 15 38 23 Z" className="fill-mustard" />
      <path
        d="M17 18 q7 -5 14 0"
        fill="none"
        className="stroke-ink/25"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  )
}
