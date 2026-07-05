import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-foreground text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground text-sm">That page doesn&apos;t exist.</p>
      <Link to="/" className="text-primary text-sm font-medium hover:underline">
        Back home
      </Link>
    </div>
  )
}
