import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
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
  return (
    <nav
      className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon size={22} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
