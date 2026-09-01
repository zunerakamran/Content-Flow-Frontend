import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login from './Login'

const AdvisorDashboard = lazy(() => import('./AdvisorDashboard'))
const ApproverDashboard = lazy(() => import('./ApproverDashboard'))
const ManagerDashboard = lazy(() => import('./ManagerDashboard'))
const PowerAdminDashboard = lazy(() => import('./PowerAdminDashboard'))
const ClientAdminDashboard = lazy(() => import('./ClientAdminDashboard'))

const DashboardFallback = () => (
  <div className="flex flex-col items-center justify-center h-screen text-gray-500">
    <div className="w-10 h-10 mb-4 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
    <p className="text-sm font-semibold">Loading dashboard…</p>
  </div>
)

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <DashboardFallback />
  if (!user) return <Navigate to="/" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />
  return children
}

const ROLE_DASHBOARDS = {
  advisor: AdvisorDashboard,
  approver: ApproverDashboard,
  manager: ManagerDashboard,
  power_admin: PowerAdminDashboard,
  client_admin: ClientAdminDashboard,
}

const LegacyDashboardRedirect = () => {
  const { role } = useParams()
  return <Navigate to={`/${role || ''}`} replace />
}

const AppRoutes = () => {
  const { user, loading } = useAuth()
  if (loading) return <DashboardFallback />

  return (
    <Routes>
      <Route path="/" element={!user ? <Login /> : <Navigate to={`/${user.role}`} replace />} />

      {Object.entries(ROLE_DASHBOARDS).map(([role, Dashboard]) => (
        <Route
          key={role}
          path={`/${role}`}
          element={(
            <PrivateRoute roles={[role]}>
              <Suspense fallback={<DashboardFallback />}>
                <Dashboard />
              </Suspense>
            </PrivateRoute>
          )}
        />
      ))}

      <Route path="/dashboard/:role" element={<LegacyDashboardRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}