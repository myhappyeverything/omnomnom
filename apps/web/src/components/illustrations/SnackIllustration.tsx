import { cn } from '@/utils/cn'

/** A simple apple — flat, minimal, warm line style. */
export function SnackIllustration({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      <path
        d="M24 18 C31 15 39 20 38 29 C37 37 30 40 24 40 C18 40 11 37 10 29 C9 20 17 15 24 18 Z"
        className="fill-dusty-coral"
      />
      <path d="M23 18 C22 14 23 11 21 8" fill="none" className="stroke-olive" strokeWidth={2} strokeLinecap="round" />
      <path d="M23 10 C26 8 29 9 30 12 C27 13 24 12 23 10 Z" className="fill-sage" />
      <ellipse cx="19" cy="25" rx="3" ry="4.5" className="fill-surface" opacity={0.35} />
    </svg>
  )
}
