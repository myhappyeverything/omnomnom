import { Outlet } from 'react-router-dom'
import { Home, Utensils, LineChart, Settings } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { PageTransition } from '@/components/PageTransition'
import { useOutboxSync } from '@/hooks/useOutbox'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/foods', label: 'Foods', icon: Utensils },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  // Draining the outbox needs an authenticated session, so it's driven from
  // here rather than at the App root (which also renders the logged-out
  // login/register routes).
  useOutboxSync()

  return (
    <div className="bg-background min-h-screen">
      <main className="pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <BottomNav items={NAV_ITEMS} />
    </div>
  )
}
