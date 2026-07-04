import { Outlet } from 'react-router-dom'
import { Home, Utensils, LineChart, Settings } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { PageTransition } from '@/components/PageTransition'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/foods', label: 'Foods', icon: Utensils },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  return (
    <div className="bg-background min-h-screen">
      <main className="pb-20">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <BottomNav items={NAV_ITEMS} />
    </div>
  )
}
