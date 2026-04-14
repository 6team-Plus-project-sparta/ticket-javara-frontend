/**
 * AuthLayout — Header 없이 중앙 정렬된 인증 전용 레이아웃
 *
 * 로그인, 회원가입 페이지처럼 Header가 필요 없는 페이지에 사용한다.
 * 화면 중앙에 카드 형태로 콘텐츠를 배치한다.
 */

import { Outlet, Link } from 'react-router-dom'

function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      {/* 로고 */}
      <Link
        to="/"
        className="mb-8 text-2xl font-bold text-blue-600"
        style={{ fontFamily: "'Jua', sans-serif" }}
      >
        티켓을 JAVA라
      </Link>
      {/* 페이지 본문 */}
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-gray-100">
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
