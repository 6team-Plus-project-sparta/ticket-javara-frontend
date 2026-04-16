import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components'

/**
 * 관리자 전용 라우트 (AdminRoute)
 * 
 * 로그인 여부 파악뿐만 아니라 user.role 이 'ADMIN'인지 확인합니다.
 * ADMIN이 아니라면 홈페이지('/') 혹은 로그인('/login')으로 리다이렉트합니다.
 */
function AdminRoute() {
  const { isLoggedIn, user, isInitializing } = useAuth()

  if (isInitializing) {
    return <LoadingSpinner />
  }

  // 로그인이 안 되어있으면 로그인으로
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // 관리자가 아니면 홈으로
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  // 통과
  return <Outlet />
}

export default AdminRoute
