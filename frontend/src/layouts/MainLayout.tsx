/**
 * MainLayout — Header가 있는 기본 레이아웃
 *
 * Header + 본문 영역으로 구성된다.
 * 대부분의 페이지(홈, 이벤트, 검색, 마이페이지 등)가 이 레이아웃을 사용한다.
 *
 * <Outlet />: react-router-dom이 자식 라우트의 페이지 컴포넌트를 여기에 렌더링한다.
 */

import { Outlet, useNavigate } from 'react-router-dom'
import { Header, SearchBar } from '@/components'
import { useAuth } from '@/contexts/AuthContext'

function MainLayout() {
  const { isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        searchSlot={
          <SearchBar
            onSearch={(keyword) => navigate(`/search?keyword=${encodeURIComponent(keyword)}`)}
          />
        }
      />
      {/* 페이지 본문 */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
