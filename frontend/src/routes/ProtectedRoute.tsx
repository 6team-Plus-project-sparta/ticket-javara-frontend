/**
 * ProtectedRoute — 인증이 필요한 페이지를 보호하는 컴포넌트
 *
 * 동작 방식:
 * - 앱 초기화 중(isInitializing)이면 로딩 스피너를 보여준다
 * - accessToken이 없으면 /login으로 리다이렉트한다
 * - 로그인 상태면 자식 컴포넌트(페이지)를 그대로 렌더링한다
 *
 * 사용 예시:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/mypage" element={<MyPage />} />
 *   </Route>
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components'

function ProtectedRoute() {
  const { isLoggedIn, isInitializing } = useAuth()

  // 앱 시작 시 토큰 복원 중 — 판단을 미룬다
  if (isInitializing) return <LoadingSpinner fullScreen />

  // 로그인 안 됨 → /login으로 이동 (현재 경로를 state로 전달해 로그인 후 복귀 가능)
  if (!isLoggedIn) return <Navigate to="/login" replace />

  // 로그인 됨 → 자식 라우트 렌더링
  return <Outlet />
}

export default ProtectedRoute
