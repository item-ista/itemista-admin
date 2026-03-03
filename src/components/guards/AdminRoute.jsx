import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../ui/LoadingScreen'

export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!isAuthenticated || !isAdmin) return <Navigate to="/login" replace />

  return <Outlet />
}
