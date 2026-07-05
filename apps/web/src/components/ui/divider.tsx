import { cn } from '@/utils/cn'

/** A hairline section separator — the app's default way to break up content instead of boxing it in cards. */
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-border border-t', className)} />
}
