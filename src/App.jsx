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
  <div className="flex items-center justify-center h-screen text-gray-500 text-sm font-semibold">
    Loading dashboard…
  </div>
)

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
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
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>

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