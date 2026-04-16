/**
 * MyPage — 마이페이지
 *
 * 진입 시 useAuth()의 user 상태를 우선 사용하고,
 * 없으면 GET /api/users/me를 직접 호출해서 최신 정보를 표시한다.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMe } from '@/api/users'
import type { UserProfile } from '@/types/user'
import { Button, LoadingSpinner } from '@/components'
import { useAuth } from '@/contexts/AuthContext'

// ─── 유틸 ────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

const ROLE_LABEL: Record<string, string> = {
  USER:  '일반 회원',
  ADMIN: '관리자',
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────

/** 메뉴 링크 행 */
function MenuRow({
  to,
  icon,
  label,
  description,
}: {
  to: string
  icon: React.ReactNode
  label: string
  description?: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 아이콘 */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        {icon}
      </div>
      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {description && (
          <p className="text-xs text-gray-400">{description}</p>
        )}
      </div>
      {/* 화살표 */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function MyPage() {
  const navigate        = useNavigate()
  const { user: ctxUser, logout, isInitializing } = useAuth()

  const [user, setUser]       = useState<UserProfile | null>(ctxUser)
  const [loading, setLoading] = useState(true)

  // Context에 user가 있으면 바로 사용, 없으면 직접 조회
  useEffect(() => {
    if (isInitializing) return // 아직 초기화 중이면 대기

    if (ctxUser) {
      setUser(ctxUser)
      setLoading(false)
      return
    }

    // 토큰은 있지만 user가 없는 경우 직접 조회
    getMe()
      .then((profile) => setUser(profile))
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoading(false))
  }, [ctxUser, isInitializing, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (loading) return <LoadingSpinner />

  if (!user) return null

  return (
    <div className="mx-auto max-w-lg space-y-6">

      {/* 페이지 타이틀 */}
      <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>

      {/* 사용자 정보 카드 */}
      <section
        aria-labelledby="profile-heading"
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* 아바타 + 닉네임 */}
        <div className="mb-5 flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white"
            aria-hidden="true"
          >
            {user.nickname?.charAt(0) ?? '?'}
          </div>
          <div>
            <h2 id="profile-heading" className="text-base font-bold text-gray-900">
              {user.nickname}
            </h2>
            <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </div>
        </div>

        {/* 상세 정보 */}
        <dl className="space-y-2 text-sm">
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 font-medium text-gray-500">이메일</dt>
            <dd className="text-gray-800">{user.email}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 font-medium text-gray-500">가입일</dt>
            <dd className="text-gray-800">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>

        {/* 내 정보 수정 버튼 */}
        <div className="mt-5">
          <Link to="/mypage/edit">
            <Button variant="ghost" size="small" className="w-full">
              내 정보 수정
            </Button>
          </Link>
        </div>
      </section>

      {/* 메뉴 목록 */}
      <nav aria-label="마이페이지 메뉴">
        <ul className="space-y-3">
          <li>
            <MenuRow
              to="/mypage/bookings"
              label="내 예매 내역"
              description="예매한 티켓을 확인하고 취소할 수 있어요"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              }
            />
          </li>
          <li>
            <MenuRow
              to="/mypage/coupons"
              label="내 쿠폰"
              description="보유한 쿠폰을 확인해요"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
          </li>
          <li>
            <MenuRow
              to="/chat"
              label="고객센터 채팅"
              description="예매 관련 문의를 남겨주세요"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />
          </li>
        </ul>
      </nav>

      {/* 로그아웃 버튼 */}
      <Button
        variant="danger"
        size="large"
        className="w-full"
        onClick={handleLogout}
      >
        로그아웃
      </Button>

    </div>
  )
}

export default MyPage
