import { Route, Routes } from 'react-router-dom'
import { StatusPage } from './pages/StatusPage'
import { OfflineBanner } from './components/OfflineBanner'
import { InstallPrompt } from './components/InstallPrompt'
import { UpdatePrompt } from './components/UpdatePrompt'

export function App() {
  return (
    <>
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<StatusPage />} />
      </Routes>
      <InstallPrompt />
      <UpdatePrompt />
    </>
  )
}
