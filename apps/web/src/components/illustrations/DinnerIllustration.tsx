import { cn } from '@/utils/cn'

/** A simple bowl of food — flat, minimal, warm line style. */
export function DinnerIllustration({
  className,
  size = 40,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      {/* Bowl */}
      <path d="M6 24 h36 a18 12 0 0 1 -36 0 Z" className="fill-olive" />
      <path d="M6 24 a18 6 0 0 0 36 0" fill="none" className="stroke-ink/15" strokeWidth={1} />
      {/* Contents */}
      <circle cx="18" cy="20" r="4" className="fill-dusty-coral" />
      <circle cx="27" cy="18" r="3.2" className="fill-mustard" />
      <circle cx="24" cy="23" r="3.6" className="fill-sage" />
      {/* Steam */}
      <path
        d="M18 12 q2 -3 0 -6 M28 12 q2 -3 0 -6"
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.5}
      />
    </svg>
  )
}
