/**
 * Header 컴포넌트
 * - 상단: 로고 + 검색창 + 고객센터 + 로그인/마이페이지
 * - 하단 탭: 홈 / 티켓 / 쿠폰 + 실시간 인기검색어 롤링
 * - 티켓 탭 hover 또는 활성 시 서브메뉴(콘서트~기타) 가로 표시
 */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Button from './Button'
import { getPopularKeywords } from '@/api/search'
import type { PopularKeyword } from '@/types/search'

interface HeaderProps {
  isLoggedIn?: boolean
  isAdmin?: boolean
  onLogout?: () => void
  searchSlot?: React.ReactNode
}

const mainNavItems = [
  { label: '홈',   path: '/' },
  { label: '티켓', path: '/ticket' },
  { label: '쿠폰', path: '/coupons' },
]

const ticketSubMenuItems = [
  { label: '콘서트', value: 'concert' },
  { label: '뮤지컬', value: 'musical' },
  { label: '스포츠', value: 'sports' },
  { label: '전시',   value: 'display' },
  { label: '기타',   value: 'etc' },
]

// ─── 실시간 인기검색어 롤링 컴포넌트 ──────────────────────────

function RollingKeywords() {
  const navigate = useNavigate()
  const [keywords, setKeywords]   = useState<PopularKeyword[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [visible, setVisible]     = useState(true)

  useEffect(() => {
    getPopularKeywords()
        .then(setKeywords)
        .catch(() => setKeywords([]))
  }, [])

  // 3초마다 다음 키워드로 롤링 (fade out → 인덱스 변경 → fade in)
  useEffect(() => {
    if (keywords.length === 0) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % keywords.length)
        setVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [keywords])

  if (keywords.length === 0) return null

  const current = keywords[currentIdx]

  return (
      <div className="ml-auto flex items-center gap-2 text-sm">
        <span className="text-xs font-bold text-[#FD002D] shrink-0">실시간 인기 검색어</span>
        <button
            onClick={() => navigate(`/search?keyword=${encodeURIComponent(current.keyword)}`)}
            className={[
              'flex items-center gap-1.5 transition-opacity duration-300 hover:text-[#FD002D]',
              visible ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            style={{ width: '100px' }}
            aria-label={`${current.rank}위 ${current.keyword} 검색`}
        >
          <span className="font-bold text-[#FD002D] w-4 text-center">{current.rank}</span>
          <span className="text-gray-700 font-medium truncate max-w-[120px]">{current.keyword}</span>
        </button>
      </div>
  )
}

// ─── 메인 Header ─────────────────────────────────────────────

function Header({ isLoggedIn = false, isAdmin = false, onLogout, searchSlot }: HeaderProps) {
  const loc      = useLocation()
  const navigate = useNavigate()
  const [ticketHovered, setTicketHovered] = useState(false)

  const isTicketActive = loc.pathname.startsWith('/ticket')
  const currentSubCategory = loc.pathname.startsWith('/ticket/')
      ? loc.pathname.split('/ticket/')[1]
      : null

  const showSubMenu = ticketHovered || isTicketActive

  return (
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm">

        {/* ── 상단: 로고 + 검색창 + 우측 버튼들 ── */}
        <div className="border-b border-gray-100">
          <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center gap-4 px-10 sm:px-16">

            {/* 로고 */}
            <Link
                to="/"
                className="shrink-0 text-2xl font-bold"
                style={{ fontFamily: "'Jua', sans-serif", color: '#FD002D' }}
                aria-label="티켓을 JAVA라 홈"
            >
              티켓을 JAVA라
            </Link>

            {/* 검색창 슬롯 */}
            {searchSlot && (
                <div className="flex-1 max-w-2xl mx-auto">
                  {searchSlot}
                </div>
            )}

            {/* 우측: 고객센터 + 로그인/마이페이지 */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Link
                  to="/chat"
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-2"
              >
                고객센터
              </Link>

              {isLoggedIn ? (
                  <>
                    {isAdmin && (
                        <Link to="/admin">
                          <Button variant="ghost" size="small" className="text-orange-500 border-orange-300 hover:bg-orange-50">
                            관리자
                          </Button>
                        </Link>
                    )}
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
        </div>

        {/* ── 하단: 메인 탭 + 실시간 인기검색어 ── */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex w-full max-w-screen-xl items-center px-10 sm:px-16">
            <nav aria-label="주요 메뉴">
              <ul className="flex items-center">
                {mainNavItems.map((item) => {
                  const isTicket = item.label === '티켓'
                  const isActive = isTicket
                      ? isTicketActive
                      : item.path === '/'
                          ? loc.pathname === '/' && !isTicketActive
                          : loc.pathname.startsWith(item.path)

                  if (isTicket) {
                    return (
                        <li
                            key={item.path}
                            onMouseEnter={() => setTicketHovered(true)}
                            onMouseLeave={() => setTicketHovered(false)}
                        >
                          <Link
                              to="/ticket/concert"
                              className={[
                                'inline-block px-5 py-3 text-base font-bold border-b-2 transition-colors',
                                isActive || ticketHovered
                                    ? 'border-[#FD002D] text-[#FD002D]'
                                    : 'border-transparent text-gray-600 hover:text-[#FD002D] hover:border-[#FD002D]',
                              ].join(' ')}
                          >
                            티켓
                          </Link>
                        </li>
                    )
                  }

                  return (
                      <li key={item.path}>
                        <Link
                            to={item.path}
                            className={[
                              'inline-block px-5 py-3 text-base font-bold border-b-2 transition-colors',
                              isActive
                                  ? 'border-[#FD002D] text-[#FD002D]'
                                  : 'border-transparent text-gray-600 hover:text-[#FD002D] hover:border-[#FD002D]',
                            ].join(' ')}
                        >
                          {item.label}
                        </Link>
                      </li>
                  )
                })}
              </ul>
            </nav>

            {/* 실시간 인기검색어 롤링 — 탭 오른쪽 끝 */}
            <RollingKeywords />
          </div>
        </div>

        {/* ── 티켓 서브메뉴 ── */}
        {showSubMenu && (
            <div
                className="border-b border-gray-100 bg-gray-50"
                onMouseEnter={() => setTicketHovered(true)}
                onMouseLeave={() => setTicketHovered(false)}
            >
              <div className="mx-auto flex w-full max-w-screen-xl items-center px-10 sm:px-16">
                <ul className="flex items-center gap-1">
                  {ticketSubMenuItems.map((sub) => (
                      <li key={sub.value}>
                        <button
                            onClick={() => navigate(`/ticket/${sub.value}`)}
                            className={[
                              'px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                              currentSubCategory === sub.value
                                  ? 'border-[#FD002D] text-[#FD002D]'
                                  : 'border-transparent text-gray-500 hover:text-[#FD002D]',
                            ].join(' ')}
                        >
                          {sub.label}
                        </button>
                      </li>
                  ))}
                </ul>
              </div>
            </div>
        )}

      </header>
  )
}

export default Header