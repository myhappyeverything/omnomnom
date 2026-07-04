import { Link } from 'react-router-dom'
import { ComingSoon } from '@/components/ComingSoon'
import { Button } from '@/components/ui/button'

export function SettingsPage() {
  return (
    <div className="flex flex-col">
      <ComingSoon title="Settings" stage="Stage 20" />
      <Button asChild variant="outline" className="mx-auto -mt-8 w-fit">
        <Link to="/notifications">Notification settings</Link>
      </Button>
    </div>
  )
}
