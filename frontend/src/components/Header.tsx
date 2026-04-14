/**
 * Header 컴포넌트
 * - 로고, 검색창 슬롯, 로그인/로그아웃, 마이페이지 버튼 포함
 * - searchSlot: 검색창 컴포넌트를 외부에서 주입 (SearchBar 등)
 * - isLoggedIn: 로그인 여부에 따라 버튼 전환
 */

import { Link, useLocation } from 'react-router-dom'
import Button from './Button'

interface NavItem {
  label: string
  path: string
}

interface HeaderProps {
  isLoggedIn?: boolean
  onLogout?: () => void
  navItems?: NavItem[]
  searchSlot?: React.ReactNode
}

const defaultNavItems: NavItem[] = [
  { label: '콘서트', path: '/events?category=CONCERT' },
  { label: '뮤지컬/연극', path: '/events?category=MUSICAL' },
  { label: '스포츠', path: '/events?category=SPORTS' },
  { label: '전시', path: '/events?category=EXHIBITION' },
]

function Header({ isLoggedIn = false, onLogout, navItems = defaultNavItems, searchSlot }: HeaderProps) {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">

        {/* 로고 */}
        <Link to="/" className="shrink-0 text-xl font-bold text-blue-600" aria-label="TicketFlow 홈">
          TicketFlow
        </Link>

        {/* 네비게이션 */}
        <nav aria-label="주요 메뉴" className="hidden md:block">
          <ul className="flex items-center gap-5">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={[
                    'text-sm font-medium transition-colors hover:text-blue-600',
                    location.pathname + location.search === item.path ? 'text-blue-600' : 'text-gray-600',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 검색창 슬롯 — 외부에서 SearchBar를 주입 */}
        {searchSlot && <div className="flex-1">{searchSlot}</div>}

        {/* 로그인/로그아웃 + 마이페이지 */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link to="/mypage">
                <Button variant="ghost" size="small">마이페이지</Button>
              </Link>
              <Button variant="secondary" size="small" onClick={onLogout}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="secondary" size="small">로그인</Button>
              </Link>
              <Link to="/signup">
                <Button size="small">회원가입</Button>
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  )
}

export default Header
