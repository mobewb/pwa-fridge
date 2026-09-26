import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAuth() {
  const { token, loading } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (loading) return <p className="center muted">Chargement…</p>
  return <Outlet />
}
