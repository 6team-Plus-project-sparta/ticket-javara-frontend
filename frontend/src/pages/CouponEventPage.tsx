/**
 * CouponEventPage — 진행 중인 쿠폰 이벤트 전체 조회 (공개)
 *
 * - 로그인 없이 누구나 볼 수 있는 공개 페이지
 * - 현재 진행 중인 쿠폰 목록을 카드 형태로 표시
 * - 로그인 상태면 "쿠폰 받기" 버튼 활성화
 * - 비로그인 상태면 "로그인 후 발급 가능" 안내
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { issueCoupon, getAllCoupons } from '@/api/coupons'
import { getMyCoupons } from '@/api/users'
import type { GetCouponResponse } from '@/types/coupon'
import type { AxiosError } from 'axios'
import { Button, LoadingSpinner } from '@/components'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'

// ─── 타입 ────────────────────────────────────────────────────

type IssueStatus = 'idle' | 'loading' | 'issued' | 'exhausted' | 'notStarted'

// GetCouponResponse에 UI 전용 필드 추가
interface CouponInfo extends GetCouponResponse {
  description?: string
  badgeLabel?: string
  /** 배너 이미지 URL — 있으면 이미지, 없으면 그라디언트 배너 표시 */
  imageUrl?: string
}

// ─── 유틸 ────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`

function parseIssueError(error: unknown): { status: IssueStatus; message: string } {
  const responseData = (error as AxiosError<{ code?: string; message?: string; data?: { code?: string; message?: string } }>).response?.data

  // 백엔드 공통 래퍼: { code, message, data } 또는 { data: { code, message } }
  const code = responseData?.code ?? responseData?.data?.code
  const msg  = responseData?.message ?? responseData?.data?.message ?? ''

  switch (code) {
    case 'COUPON_ALREADY_ISSUED':
    case 'C001':
      return { status: 'issued',     message: '이미 발급받은 쿠폰입니다.' }
    case 'COUPON_EXHAUSTED':
    case 'C002':
      return { status: 'exhausted',  message: '쿠폰이 모두 소진되었습니다.' }
    case 'COUPON_NOT_STARTED':
    case 'C003':
      return { status: 'notStarted', message: msg || '쿠폰 발급 시간이 아닙니다.' }
    case 'SERVICE_UNAVAILABLE':
      return { status: 'idle',       message: '현재 서비스 이용이 어렵습니다. 잠시 후 다시 시도해주세요.' }
    default:
      return { status: 'idle',       message: msg || '쿠폰 발급 중 오류가 발생했습니다.' }
  }
}

// ─── 쿠폰 카드 ───────────────────────────────────────────────

function CouponCard({
  coupon,
  isLoggedIn,
  initialIssued = false,
}: {
  coupon: CouponInfo
  isLoggedIn: boolean
  initialIssued?: boolean
}) {
  const { toast }   = useToast()
  const navigate    = useNavigate()
  // 이미 발급받은 쿠폰이면 처음부터 'issued', 수량 0이면 'exhausted' 상태로 시작
  const [status, setStatus] = useState<IssueStatus>(() => {
    if (initialIssued) return 'issued'
    if (coupon.remainingQuantity <= 0) return 'exhausted'
    return 'idle'
  })
  const [remaining, setRemaining] = useState(coupon.remainingQuantity)

  const remainingRatio = Math.round((remaining / coupon.totalQuantity) * 100)
  const barColor =
    remainingRatio === 0  ? 'bg-gray-300' :
    remainingRatio <= 20  ? 'bg-red-500'  :
    remainingRatio <= 50  ? 'bg-amber-400' :
                            'bg-primary-500'

  const handleIssue = async () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/coupons' } })
      return
    }
    setStatus('loading')
    try {
      const res = await issueCoupon(coupon.couponId)
      setStatus('issued')
      setRemaining((prev) => Math.max(0, prev - 1))
      toast.success(`🎉 ${res.couponName} 발급 완료! ${formatPrice(res.discountAmount)} 할인`)
    } catch (error) {
      const { status: next, message } = parseIssueError(error)
      setStatus(next)
      toast.error(message)
      if (next === 'exhausted') setRemaining(0)
    }
  }

  const isExpired = new Date(coupon.expiredAt) < new Date()
  const isSoldOut = remaining === 0

  return (
    <article className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-md hover:shadow-lg transition-shadow">

      {/* 상단 배너 — imageUrl 있으면 이미지, 없으면 그라디언트 */}
      {coupon.imageUrl ? (
        <div className="relative h-44 w-full overflow-hidden">
          <img
            src={coupon.imageUrl}
            alt={coupon.name}
            className="h-full w-full object-cover"
          />
          {coupon.badgeLabel && (
            <span className="absolute left-4 top-4 rounded-full bg-primary-500 px-3 py-0.5 text-xs font-bold text-white shadow">
              {coupon.badgeLabel}
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-5 py-4">
            <p className="text-2xl font-extrabold text-white">
              {formatPrice(coupon.discountAmount)}
              <span className="ml-1.5 text-sm font-normal text-white/80">할인</span>
            </p>
            <p className="text-xs text-white/80">{coupon.name}</p>
          </div>
        </div>
      ) : (
        <div className="relative bg-gradient-to-br from-coupon-500 to-coupon-700 px-6 py-8 text-white">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" aria-hidden="true" />
          {coupon.badgeLabel && (
            <span className="relative z-10 mb-3 inline-block rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold text-white">
              {coupon.badgeLabel}
            </span>
          )}
          <div className="relative z-10">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-blue-200">
              선착순 한정 쿠폰
            </p>
            <p className="text-4xl font-extrabold">
              {formatPrice(coupon.discountAmount)}
              <span className="ml-2 text-lg font-normal text-blue-200">할인</span>
            </p>
            <p className="mt-2 text-base font-semibold text-blue-100">{coupon.name}</p>
          </div>
        </div>
      )}

      {/* 절취선 */}
      <div className="flex items-center">
        <div className="h-5 w-5 -ml-2.5 shrink-0 rounded-full bg-gray-100" aria-hidden="true" />
        <div className="flex-1 border-t-2 border-dashed border-gray-200" aria-hidden="true" />
        <div className="h-5 w-5 -mr-2.5 shrink-0 rounded-full bg-gray-100" aria-hidden="true" />
      </div>

      {/* 하단 정보 */}
      <div className="px-6 py-5 space-y-4">
        {coupon.description && (
          <p className="text-sm text-gray-500">{coupon.description}</p>
        )}

        {/* 잔여 수량 바 */}
        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-gray-500">잔여 수량</span>
            <span className={[
              'font-semibold',
              isSoldOut ? 'text-gray-400' : remainingRatio <= 20 ? 'text-red-500' : 'text-primary-600',
            ].join(' ')}>
              {isSoldOut ? '소진' : `${remaining} / ${coupon.totalQuantity}개`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className={['h-full rounded-full transition-all', barColor].join(' ')} style={{ width: `${remainingRatio}%` }} />
          </div>
        </div>

        {/* 기간 */}
        <div className="space-y-1 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>발급 시작</span>
            <span className="text-gray-600">{formatDate(coupon.startAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>사용 만료</span>
            <span className="text-gray-600">{formatDate(coupon.expiredAt)}</span>
          </div>
        </div>

        {/* 버튼 */}
        {isExpired || isSoldOut ? (
          <Button size="large" variant="secondary" disabled className="w-full">
            {isExpired ? '기간 만료' : '수량 소진'}
          </Button>
        ) : status === 'issued' ? (
          <>
            <Button size="large" variant="secondary" disabled className="w-full">발급 완료</Button>
            <p className="text-center text-xs text-primary-500">
              <Link to="/mypage/coupons" className="underline">내 쿠폰함에서 확인하기 →</Link>
            </p>
          </>
        ) : (
          <>
            <Button
              size="large"
              loading={status === 'loading'}
              disabled={status === 'notStarted' || status === 'exhausted'}
              className="w-full"
              onClick={handleIssue}
            >
              {!isLoggedIn ? '로그인 후 쿠폰 받기' : '쿠폰 받기'}
            </Button>
            {/* 비로그인 안내 */}
            {!isLoggedIn && (
              <p className="text-center text-xs text-gray-400">
                <Link to="/login" state={{ from: '/coupons' }} className="text-primary-500 hover:underline">로그인</Link>
                {' '}후 무료로 발급받을 수 있어요
              </p>
            )}
          </>
        )}
      </div>
    </article>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function CouponEventPage() {
  const { isLoggedIn } = useAuth()
  const { toast }      = useToast()

  const [coupons, setCoupons]         = useState<CouponInfo[]>([])
  const [issuedCouponIds, setIssuedCouponIds] = useState<Set<number>>(new Set())
  const [loading, setLoading]         = useState(true)

  // 쿠폰 목록 + 내 발급 목록 동시 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [couponRes, myRes] = await Promise.allSettled([
          getAllCoupons(0, 20),
          isLoggedIn ? getMyCoupons() : Promise.resolve([]),
        ])

        if (couponRes.status === 'fulfilled') {
          const list = couponRes.value.content ?? []
          console.log('[CouponEventPage] 쿠폰 목록:', list)
          setCoupons(list)
        } else {
          toast.error('쿠폰 목록을 불러오지 못했습니다.')
        }

        if (myRes.status === 'fulfilled' && Array.isArray(myRes.value)) {
          // 내가 발급받은 쿠폰의 couponId Set 생성
          const ids = new Set(myRes.value.map((c) => c.couponId))
          setIssuedCouponIds(ids)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">쿠폰 이벤트</h1>
        <p className="mt-1 text-sm text-gray-500">지금 진행 중인 할인 쿠폰을 받아보세요</p>
      </div>

      {/* 쿠폰 목록 */}
      {loading ? (
        <LoadingSpinner />
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-4xl">🎟️</p>
          <p className="text-base font-medium text-gray-600">현재 진행 중인 쿠폰 이벤트가 없습니다.</p>
          <p className="text-sm text-gray-400">새로운 이벤트가 시작되면 알려드릴게요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon.couponId}
              coupon={coupon}
              isLoggedIn={isLoggedIn}
              initialIssued={issuedCouponIds.has(coupon.couponId)}
            />
          ))}
        </div>
      )}

    </div>
  )
}

export default CouponEventPage
