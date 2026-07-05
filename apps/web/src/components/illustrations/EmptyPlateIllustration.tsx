import { cn } from '@/utils/cn'

/** An empty plate — used where no meals/foods have been logged yet. */
export function EmptyPlateIllustration({ className, size = 72 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      <circle cx="48" cy="48" r="34" fill="none" className="stroke-border" strokeWidth={3} />
      <circle cx="48" cy="48" r="20" fill="none" className="stroke-border" strokeWidth={2} />
      <path
        d="M34 30 v10 M34 30 a3 3 0 0 1 6 0 v10 M40 30 v14"
        fill="none"
        className="stroke-dusty-coral"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d="M60 30 c-3 3 -3 8 0 11 v13"
        fill="none"
        className="stroke-dusty-coral"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </svg>
  )
}
