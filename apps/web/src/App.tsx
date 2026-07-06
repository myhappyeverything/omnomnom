import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { OfflineBanner } from './components/OfflineBanner'
import { InstallPrompt } from './components/InstallPrompt'
import { UpdatePrompt } from './components/UpdatePrompt'
import { Toaster } from './components/ui/sonner'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { useAuth } from './context/AuthContext'

// Route-level code splitting: each page ships as its own chunk, fetched on
// first navigation rather than bloating the initial bundle every stage adds
// another full page to.
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const OnboardingPage = lazy(() =>
  import('./pages/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
)
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const FoodsPage = lazy(() => import('./pages/FoodsPage').then((m) => ({ default: m.FoodsPage })))
const PhotoLogPage = lazy(() =>
  import('./pages/PhotoLogPage').then((m) => ({ default: m.PhotoLogPage })),
)
const ScanLabelPage = lazy(() =>
  import('./pages/ScanLabelPage').then((m) => ({ default: m.ScanLabelPage })),
)
const WaterPage = lazy(() => import('./pages/WaterPage').then((m) => ({ default: m.WaterPage })))
const WeightPage = lazy(() => import('./pages/WeightPage').then((m) => ({ default: m.WeightPage })))
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const PrivacyPolicyPage = lazy(() =>
  import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })),
)
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })))
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

function RouteFallback() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div
        className="border-border border-t-primary size-8 animate-spin rounded-full border-2"
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}

/** "/" is public marketing for a logged-out visitor, but bounces straight to the app once signed in. */
function RootRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <RouteFallback />
  if (user) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

export function App() {
  return (
    <>
      <OfflineBanner />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<OnboardingPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/foods" element={<FoodsPage />} />
            <Route path="/log/photo" element={<PhotoLogPage />} />
            <Route path="/log/label" element={<ScanLabelPage />} />
            <Route path="/water" element={<WaterPage />} />
            <Route path="/weight" element={<WeightPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
      <InstallPrompt />
      <UpdatePrompt />
      <Toaster position="top-center" />
    </>
  )
}
