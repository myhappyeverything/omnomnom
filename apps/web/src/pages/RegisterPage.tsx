import { Link } from 'react-router-dom'
import { ComingSoon } from '@/components/ComingSoon'

export function RegisterPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <ComingSoon title="Create account" stage="Stage 11" />
      <Link to="/login" className="text-primary text-sm hover:underline">
        Already have an account? Sign in
      </Link>
    </div>
  )
}
