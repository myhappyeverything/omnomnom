import { cn } from '@/utils/cn'

/** A simple bathroom scale — used where no weight has been logged yet. */
export function ScaleIllustration({ className, size = 72 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      <rect x="16" y="34" width="64" height="44" rx="10" className="fill-surface-muted" />
      <rect
        x="16"
        y="34"
        width="64"
        height="44"
        rx="10"
        fill="none"
        className="stroke-border"
        strokeWidth={2}
      />
      <circle cx="48" cy="56" r="14" fill="none" className="stroke-olive" strokeWidth={2.4} />
      <path d="M48 56 l6 -8" className="stroke-olive" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx="48" cy="56" r="1.8" className="fill-olive" />
    </svg>
  )
}
