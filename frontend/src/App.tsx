// 應用程式主路由設定
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import DayView from './pages/DayView'
import WeekView from './pages/WeekView'
import MonthView from './pages/MonthView'
import HabitsPage from './pages/HabitsPage'
import TemplatesPage from './pages/TemplatesPage'

// 需要登入才能存取的路由守衛
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/day" element={<ProtectedRoute><DayView /></ProtectedRoute>} />
        <Route path="/week" element={<ProtectedRoute><WeekView /></ProtectedRoute>} />
        <Route path="/month" element={<ProtectedRoute><MonthView /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/day" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
