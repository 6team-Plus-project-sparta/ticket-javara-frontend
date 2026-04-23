/**
 * MainLayout — Header가 있는 기본 레이아웃
 *
 * Header + 본문 영역으로 구성된다.
 * 대부분의 페이지(홈, 이벤트, 검색, 마이페이지 등)가 이 레이아웃을 사용한다.
 *
 * <Outlet />: react-router-dom이 자식 라우트의 페이지 컴포넌트를 여기에 렌더링한다.
 */

/**
 * MainLayout — Header + Footer가 있는 기본 레이아웃
 */

/**
 * MainLayout — Header + Footer가 있는 기본 레이아웃
 */

import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Header, SearchBar } from '@/components'
import { useAuth } from '@/contexts/AuthContext'

// ─── 푸터 컴포넌트 ────────────────────────────────────────────

function Footer() {
    const members = ['정태규', '강태훈', '선경안', '이지민', '임하은']
    const techStack = ['Java 17', 'Spring Boot', 'MySQL', 'Redis', 'React', 'TypeScript', 'Docker']

    return (
        <footer className="mt-16 border-t border-gray-200 bg-white">
            <div className="mx-auto w-full max-w-screen-xl px-10 py-10 sm:px-16">

                <div className="flex flex-col gap-8 md:flex-row md:justify-between">

                    {/* 좌측: 프로젝트 정보 */}
                    <div className="space-y-2 min-w-0">
                        <p className="text-xl font-extrabold whitespace-nowrap" style={{ color: '#FD002D' }}>
                            티켓을 JAVA라
                        </p>
                        <p className="text-sm text-gray-500 whitespace-nowrap">Ticket_Javara · 스파르타 내일배움캠프 Spring 3기</p>
                        <p className="text-sm text-gray-500 whitespace-nowrap">CH5 스프링 플러스 프로젝트</p>
                        <a
                            href="https://github.com/6team-Plus-project-sparta"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.573C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                            github.com/6team-Plus-project-sparta
                        </a>
                    </div>

                    {/* 가운데: 팀 정보 */}
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-700">🔥 Team HOT6</p>
                        <p className="text-sm text-gray-500">
                            {members.join(' | ')}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            Tutor · 홍순구
                        </p>
                    </div>

                    {/* 우측: 기술 스택 */}
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-700">🛠 기술 스택</p>
                        <p className="text-sm text-gray-500">
                            {techStack.join(' · ')}
                        </p>
                    </div>

                </div>

                {/* 하단 카피라이트 */}
                <div className="mt-8 border-t border-gray-100 pt-6 text-center">
                    <p className="text-xs text-gray-400">
                        © 2026 Team HOT6 · Ticket_Javara · 스파르타 내일배움캠프 Spring 3기
                    </p>
                </div>

            </div>
        </footer>
    )
}

// ─── 메인 레이아웃 ────────────────────────────────────────────

function MainLayout() {
    const { isLoggedIn, logout, user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const isChatPage = location.pathname === '/chat'

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className={['bg-gray-50', isChatPage ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen flex flex-col'].join(' ')}>
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
            <main className={isChatPage
                ? 'flex-1 overflow-hidden px-10 py-6'
                : 'flex-1 mx-auto w-full max-w-screen-xl px-10 py-10 sm:px-16'
            }>
                <Outlet />
            </main>
            {!isChatPage && <Footer />}
        </div>
    )
}

export default MainLayout