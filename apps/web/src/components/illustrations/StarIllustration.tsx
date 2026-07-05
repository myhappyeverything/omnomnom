import { cn } from '@/utils/cn'

/** A simple star outline — used where no favourites have been saved yet. */
export function StarIllustration({ className, size = 72 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      <path
        d="M48 18 L57 40 L81 42 L63 58 L68 82 L48 70 L28 82 L33 58 L15 42 L39 40 Z"
        fill="none"
        className="stroke-mustard"
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </svg>
  )
}
