import { NavLink, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { QuickAddFab } from '@/components/QuickAddFab'
import { cn } from '@/utils/cn'

export interface BottomNavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface BottomNavProps {
  items: BottomNavItem[]
}

function NavItems({ items }: { items: BottomNavItem[] }) {
  const location = useLocation()
  return (
    <>
      {items.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to
        return (
          <li key={to} className="relative flex-1">
            {isActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="bg-primary absolute inset-x-8 top-0 h-0.5 rounded-full"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <NavLink
              to={to}
              end
              className={cn(
                'flex flex-col items-center gap-1.5 py-3.5 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        )
      })}
    </>
  )
}

/** Splits nav items evenly either side of the center quick-add trigger — assumes an even count. */
export function BottomNav({ items }: BottomNavProps) {
  const half = Math.ceil(items.length / 2)
  const left = items.slice(0, half)
  const right = items.slice(half)

  return (
    <nav
      className="border-border bg-surface/90 fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
      aria-label="Primary"
    >
      <ul className="relative flex items-stretch justify-around">
        <NavItems items={left} />
        <li className="relative w-16 shrink-0">
          <QuickAddFab />
        </li>
        <NavItems items={right} />
      </ul>
    </nav>
  )
}
