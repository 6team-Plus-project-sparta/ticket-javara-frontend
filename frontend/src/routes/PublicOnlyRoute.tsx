/**
 * PublicOnlyRoute — 비로그인 사용자만 접근 가능한 페이지 (로그인, 회원가입)
 *
 * 동작 방식:
 * - 앱 초기화 중이면 로딩 스피너를 보여준다
 * - 이미 로그인한 사용자가 /login, /signup에 접근하면 /로 리다이렉트한다
 * - 비로그인 상태면 자식 컴포넌트(페이지)를 그대로 렌더링한다
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components'

function PublicOnlyRoute() {
  const { isLoggedIn, isInitializing } = useAuth()

  if (isInitializing) return <LoadingSpinner fullScreen />

  // 이미 로그인 됨 → 홈으로 이동
  if (isLoggedIn) return <Navigate to="/" replace />

  return <Outlet />
}

export default PublicOnlyRoute
