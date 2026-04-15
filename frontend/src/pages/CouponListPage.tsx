/**
 * CouponListPage — 내 쿠폰 목록 화면
 *
 * 구성 요소:
 * 1. 쿠폰 카드 목록 (사용 가능 / 만료 임박 / 사용 완료 / 만료)
 * 2. 데이터 없을 때 EmptyState
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyCoupons } from '@/api/users'
import type { UserCoupon } from '@/types/user'
import { EmptyState, LoadingSpinner, StatusBadge } from '@/components'
import { useToast } from '@/components/Toast'

// ─── 유틸 ────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`

/**
 * 만료 임박 여부 — 오늘 기준 7일 이내 만료되는 ISSUED 쿠폰
 */
function isExpiringSoon(coupon: UserCoupon): boolean {
  if (coupon.status !== 'ISSUED') return false
  const diff = new Date(coupon.expiredAt).getTime() - Date.now()
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000
}

/**
 * 쿠폰 정렬 순서
 * 1. ISSUED (사용 가능) — 만료 임박 순
 * 2. USED (사용 완료)
 * 3. EXPIRED (만료)
 */
function sortCoupons(coupons: UserCoupon[]): UserCoupon[] {
  const order = { ISSUED: 0, USED: 1, EXPIRED: 2 }
  return [...coupons].sort((a, b) => {
    const statusDiff = (order[a.status] ?? 9) - (order[b.status] ?? 9)
    if (statusDiff !== 0) return statusDiff
    // 같은 상태면 만료일 빠른 순
    return new Date(a.expiredAt).getTime() - new Date(b.expiredAt).getTime()
  })
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────

/** 쿠폰 카드 */
function CouponCard({ coupon }: { coupon: UserCoupon }) {
  const expiringSoon = isExpiringSoon(coupon)
  const isDimmed     = coupon.status === 'USED' || coupon.status === 'EXPIRED'

  // 만료까지 남은 일수 계산
  const daysLeft = Math.ceil(
    (new Date(coupon.expiredAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <article
      className={[
        'relative overflow-hidden rounded-xl border p-5 transition-opacity',
        isDimmed
          ? 'border-gray-100 bg-gray-50 opacity-60'
          : expiringSoon
          ? 'border-orange-200 bg-orange-50'
          : 'border-blue-100 bg-white shadow-sm',
      ].join(' ')}
    >
      {/* 만료 임박 리본 */}
      {expiringSoon && (
        <div
          className="absolute right-0 top-0 rounded-bl-lg bg-orange-500 px-2 py-0.5 text-xs font-bold text-white"
          aria-label="만료 임박"
        >
          D-{daysLeft}
        </div>
      )}

      {/* 왼쪽 장식 바 */}
      <div
        className={[
          'absolute left-0 top-0 h-full w-1 rounded-l-xl',
          isDimmed      ? 'bg-gray-300' :
          expiringSoon  ? 'bg-orange-400' :
                          'bg-blue-500',
        ].join(' ')}
        aria-hidden="true"
      />

      <div className="pl-3">
        {/* 상단: 쿠폰명 + 상태 배지 */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className={[
            'text-sm font-semibold leading-snug',
            isDimmed ? 'text-gray-400' : 'text-gray-900',
          ].join(' ')}>
            {coupon.couponName}
          </h3>
          <StatusBadge status={coupon.status} />
        </div>

        {/* 할인 금액 */}
        <p className={[
          'text-2xl font-extrabold',
          isDimmed ? 'text-gray-300' : 'text-blue-600',
        ].join(' ')}>
          {formatPrice(coupon.discountAmount)}
          <span className="ml-1 text-sm font-normal text-gray-400">할인</span>
        </p>

        {/* 만료일 */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className={isDimmed ? 'text-gray-400' : 'text-gray-500'}>
            만료일: {formatDate(coupon.expiredAt)}
          </span>
          {/* 만료 임박 안내 */}
          {expiringSoon && (
            <span className="font-medium text-orange-500">
              {daysLeft === 0 ? '오늘 만료' : `${daysLeft}일 후 만료`}
            </span>
          )}
          {/* 사용 완료 날짜 */}
          {coupon.status === 'USED' && (
            <span className="text-gray-400">
              발급일: {formatDate(coupon.issuedAt)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function CouponListPage() {
  const navigate  = useNavigate()
  const { toast } = useToast()

  const [coupons, setCoupons] = useState<UserCoupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyCoupons()
      .then((data) => setCoupons(sortCoupons(data)))
      .catch(() => toast.error('쿠폰 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [toast])

  // 사용 가능한 쿠폰 수
  const usableCount = coupons.filter((c) => c.status === 'ISSUED').length

  return (
    <div className="mx-auto max-w-lg space-y-5">

      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/mypage')}
          aria-label="마이페이지로 돌아가기"
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">내 쿠폰</h1>
          {!loading && coupons.length > 0 && (
            <p className="text-xs text-gray-400">
              사용 가능 <span className="font-semibold text-blue-600">{usableCount}장</span>
              {' '}/ 전체 {coupons.length}장
            </p>
          )}
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <LoadingSpinner />
      ) : coupons.length === 0 ? (
        <EmptyState
          title="보유한 쿠폰이 없습니다"
          description="이벤트나 선착순 쿠폰 발급을 통해 쿠폰을 받아보세요"
          actionLabel="쿠폰 발급받기"
          onAction={() => navigate('/coupon/issue')}
        />
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <CouponCard key={coupon.userCouponId} coupon={coupon} />
          ))}
        </div>
      )}

    </div>
  )
}

export default CouponListPage
