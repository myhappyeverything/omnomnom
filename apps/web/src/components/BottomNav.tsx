import { NavLink, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface BottomNavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface BottomNavProps {
  items: BottomNavItem[]
}

export function BottomNav({ items }: BottomNavProps) {
  const location = useLocation()

  return (
    <nav
      className="border-border bg-surface/90 fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around">
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
      </ul>
    </nav>
  )
}
