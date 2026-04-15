/**
 * AdminLayout — 관리자 전용 레이아웃
 *
 * 상단 네비게이션: [이벤트 관리] [쿠폰 관리] [CS 대시보드]
 * Header와 유사하지만, 관리자 전용 메뉴로만 구성됨.
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components'
import { useAuth } from '@/contexts/AuthContext'

function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { label: '이벤트 관리', path: '/admin/events' },
    { label: '쿠폰 관리', path: '/admin/coupons' },
    { label: 'CS 대시보드', path: '/admin/chat' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 관리자 Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 w-full items-center gap-4 px-6 md:px-8">
          
          <div className="shrink-0 text-xl font-bold text-gray-800 flex items-center gap-2">
            <span style={{ fontFamily: "'Jua', sans-serif" }} className="text-blue-600">티켓을 JAVA라</span>
            <span className="text-xs font-semibold bg-gray-800 text-white px-2 py-0.5 rounded uppercase tracking-wider">Admin</span>
          </div>

          <nav aria-label="관리자 메뉴" className="ml-8 hidden md:block">
            <ul className="flex items-center gap-6">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      [
                        'text-sm font-bold transition-all relative pb-5 pt-5',
                        isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="small" onClick={() => navigate('/')}>
              사용자 홈
            </Button>
            <Button variant="secondary" size="small" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* 페이지 본문 */}
      <main className="flex-1 w-full mx-auto p-4 md:p-6 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
