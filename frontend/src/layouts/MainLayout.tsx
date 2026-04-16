/**
 * MainLayout — Header가 있는 기본 레이아웃
 *
 * Header + 본문 영역으로 구성된다.
 * 대부분의 페이지(홈, 이벤트, 검색, 마이페이지 등)가 이 레이아웃을 사용한다.
 *
 * <Outlet />: react-router-dom이 자식 라우트의 페이지 컴포넌트를 여기에 렌더링한다.
 */

import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Header, SearchBar } from '@/components'
import { useAuth } from '@/contexts/AuthContext'

function MainLayout() {
  const { isLoggedIn, logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // 채팅 페이지는 뷰포트 전체를 차지하고 내부만 스크롤
  const isChatPage = location.pathname === '/chat'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={['bg-gray-50', isChatPage ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen'].join(' ')}>
      <Header
        isLoggedIn={isLoggedIn}
        isAdmin={user?.role === 'ADMIN'}
        onLogout={handleLogout}
        searchSlot={
          <SearchBar
            onSearch={(keyword) => navigate(`/search?keyword=${encodeURIComponent(keyword)}`)}
          />
        }
      />
      {/* 페이지 본문 — 좌우 여백 충분히, 컨테이너 중앙 정렬 */}
      <main className={isChatPage
        ? 'flex-1 overflow-hidden px-10 py-6'
        : 'mx-auto w-full max-w-screen-xl px-10 py-10 sm:px-16'
      }>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
