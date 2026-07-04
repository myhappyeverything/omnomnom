import { Route, Routes } from 'react-router-dom'
import { StatusPage } from './pages/StatusPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<StatusPage />} />
    </Routes>
  )
}
