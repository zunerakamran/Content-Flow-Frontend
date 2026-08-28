import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login from './Login'
import AdvisorDashboard from './AdvisorDashboard'
import ApproverDashboard from './ApproverDashboard'
import ManagerDashboard from './ManagerDashboard'
import PowerAdminDashboard from './PowerAdminDashboard'
import ClientAdminDashboard from './ClientAdminDashboard'

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user) return <Navigate to="/" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />
  return children
}

const AppRoutes = () => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>

  return (
    <Routes>
      <Route path="/" element={!user ? <Login /> : <Navigate to={`/dashboard/${user.role}`} />} />

      <Route path="/dashboard/advisor" element={
        <PrivateRoute roles={['advisor']}><AdvisorDashboard /></PrivateRoute>
      } />
      <Route path="/dashboard/approver" element={
        <PrivateRoute roles={['approver']}><ApproverDashboard /></PrivateRoute>
      } />
      <Route path="/dashboard/manager" element={
        <PrivateRoute roles={['manager']}><ManagerDashboard /></PrivateRoute>
      } />
      <Route path="/dashboard/power_admin" element={
        <PrivateRoute roles={['power_admin']}><PowerAdminDashboard /></PrivateRoute>
      } />
      <Route path="/dashboard/client_admin" element={
        <PrivateRoute roles={['client_admin']}><ClientAdminDashboard /></PrivateRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
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