/**
 * CouponIssuePage — 선착순 쿠폰 발급 화면 (SCR-012)
 *
 * 구조:
 * - CouponIssueCard: 쿠폰 1개의 발급 UI (재사용 가능한 단위 컴포넌트)
 * - CouponIssuePage: 카드 목록을 렌더링하는 페이지
 *   → 추후 COUPON_LIST 배열에 항목을 추가하면 여러 쿠폰 카드로 확장 가능
 *
 * 버튼 상태:
 * - 'idle'    : 발급 가능 (파란 버튼)
 * - 'loading' : 요청 중 (로딩 스피너)
 * - 'issued'  : 이미 발급 (회색, 비활성)
 * - 'exhausted': 소진 (회색, 비활성)
 * - 'notStarted': 발급 전 (회색, 비활성)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { issueCoupon } from '@/api/coupons'
import type { AxiosError } from 'axios'
import { Button } from '@/components'
import { useToast } from '@/components/Toast'

// ─── 타입 ────────────────────────────────────────────────────

type IssueStatus = 'idle' | 'loading' | 'issued' | 'exhausted' | 'notStarted'

/** 쿠폰 카드에 표시할 정적 정보 */
interface CouponInfo {
  couponId: number
  name: string
  discountAmount: number
  totalQuantity: number
  /** 표시용 잔여 수량 (실제 재고는 서버 기준) */
  remainingQuantity: number
  startAt: string
  expiredAt: string
  description?: string
  /** 배너 이미지 URL — 있으면 이미지, 없으면 그라디언트 배너 표시 */
  imageUrl?: string
}

// ─── 현재 진행 중인 쿠폰 목록 ────────────────────────────────
// 추후 API로 목록을 받아오는 구조로 교체 가능

const COUPON_LIST: CouponInfo[] = [
  {
    couponId:          3,
    name:              '신규 가입 5,000원 할인',
    discountAmount:    5000,
    totalQuantity:     100,
    remainingQuantity: 43,
    startAt:           '2026-04-10T12:00:00',
    expiredAt:         '2026-05-31T23:59:59',
    description:       '선착순 100명 한정! 첫 예매 시 사용 가능한 할인 쿠폰',
  },
]

// ─── 유틸 ────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`

/** 에러 코드 → { status, message } */
function parseIssueError(error: unknown): { status: IssueStatus; message: string } {
  const code = (error as AxiosError<{ code: string; message: string }>).response?.data?.code
  const serverMsg = (error as AxiosError<{ code: string; message: string }>).response?.data?.message ?? ''

  switch (code) {
    case 'COUPON_ALREADY_ISSUED':
      return { status: 'issued',     message: '이미 발급받은 쿠폰입니다.' }
    case 'COUPON_EXHAUSTED':
      return { status: 'exhausted',  message: '쿠폰이 모두 소진되었습니다.' }
    case 'COUPON_NOT_STARTED':
      return { status: 'notStarted', message: serverMsg || '쿠폰 발급 시간이 아닙니다.' }
    case 'SERVICE_UNAVAILABLE':
      return { status: 'idle',       message: '현재 서비스 이용이 어렵습니다. 잠시 후 다시 시도해주세요.' }
    default:
      return { status: 'idle',       message: '쿠폰 발급 중 오류가 발생했습니다.' }
  }
}

// ─── 버튼 설정 ────────────────────────────────────────────────

const BUTTON_CONFIG: Record<Exclude<IssueStatus, 'loading'>, { label: string; disabled: boolean; variant: 'primary' | 'secondary' }> = {
  idle:       { label: '쿠폰 받기',      disabled: false, variant: 'primary' },
  issued:     { label: '이미 발급됨',    disabled: true,  variant: 'secondary' },
  exhausted:  { label: '수량 소진',      disabled: true,  variant: 'secondary' },
  notStarted: { label: '발급 전',        disabled: true,  variant: 'secondary' },
}

// ─── CouponIssueCard ─────────────────────────────────────────

/**
 * CouponIssueCard — 쿠폰 1개의 발급 UI
 * 이 컴포넌트를 여러 개 렌더링하면 다중 쿠폰 화면으로 확장된다.
 */
function CouponIssueCard({ coupon }: { coupon: CouponInfo }) {
  const { toast } = useToast()

  const [status, setStatus]                 = useState<IssueStatus>('idle')
  const [remaining, setRemaining]           = useState(coupon.remainingQuantity)

  // 잔여 수량 비율 (0~100)
  const remainingRatio = Math.round((remaining / coupon.totalQuantity) * 100)

  // 잔여 수량 색상
  const barColor =
    remainingRatio === 0  ? 'bg-gray-300' :
    remainingRatio <= 20  ? 'bg-red-500'  :
    remainingRatio <= 50  ? 'bg-yellow-400' :
                            'bg-blue-500'

  const handleIssue = async () => {
    setStatus('loading')
    try {
      const res = await issueCoupon(coupon.couponId)
      setStatus('issued')
      setRemaining((prev) => Math.max(0, prev - 1))
      toast.success(`🎉 ${res.couponName} 발급 완료! ${formatPrice(res.discountAmount)} 할인`)
    } catch (error) {
      const { status: nextStatus, message } = parseIssueError(error)
      setStatus(nextStatus)
      toast.error(message)
      // 소진 상태면 잔여 수량 0으로 표시
      if (nextStatus === 'exhausted') setRemaining(0)
    }
  }

  const btnConfig = status !== 'loading' ? BUTTON_CONFIG[status] : null

  return (
    <article className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-md">

      {/* 상단 배너 — imageUrl 있으면 이미지, 없으면 그라디언트 */}
      {coupon.imageUrl ? (
        <div className="relative h-44 w-full overflow-hidden">
          <img
            src={coupon.imageUrl}
            alt={coupon.name}
            className="h-full w-full object-cover"
          />
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
          {/* 배경 장식 */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" aria-hidden="true" />
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

      {/* 점선 구분선 (티켓 절취선 느낌) */}
      <div className="flex items-center">
        <div className="h-5 w-5 -ml-2.5 shrink-0 rounded-full bg-gray-100" aria-hidden="true" />
        <div className="flex-1 border-t-2 border-dashed border-gray-200" aria-hidden="true" />
        <div className="h-5 w-5 -mr-2.5 shrink-0 rounded-full bg-gray-100" aria-hidden="true" />
      </div>

      {/* 하단 정보 영역 */}
      <div className="px-6 py-5 space-y-4">

        {/* 설명 */}
        {coupon.description && (
          <p className="text-sm text-gray-500">{coupon.description}</p>
        )}

        {/* 잔여 수량 바 */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-gray-500">잔여 수량</span>
            <span className={[
              'font-semibold',
              remaining === 0       ? 'text-gray-400' :
              remainingRatio <= 20  ? 'text-red-500'  :
                                      'text-blue-600',
            ].join(' ')}>
              {remaining === 0 ? '소진' : `${remaining} / ${coupon.totalQuantity}개`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
            <div
              className={['h-full rounded-full transition-all', barColor].join(' ')}
              style={{ width: `${remainingRatio}%` }}
            />
          </div>
        </div>

        {/* 발급 기간 */}
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

        {/* 발급 버튼 */}
        {btnConfig ? (
          <Button
            size="large"
            variant={btnConfig.variant}
            disabled={btnConfig.disabled}
            className="w-full"
            onClick={handleIssue}
          >
            {btnConfig.label}
          </Button>
        ) : (
          <Button size="large" loading className="w-full">
            발급 중...
          </Button>
        )}

        {/* 발급 완료 안내 */}
        {status === 'issued' && (
          <p className="text-center text-xs text-blue-500">
            내 쿠폰함에서 확인할 수 있어요 →{' '}
            <a href="/mypage/coupons" className="underline">내 쿠폰 보기</a>
          </p>
        )}

      </div>
    </article>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function CouponIssuePage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-md space-y-5">

      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="이전 페이지로 돌아가기"
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">쿠폰 발급</h1>
      </div>

      {/* 쿠폰 카드 목록 — COUPON_LIST에 항목 추가 시 자동으로 카드 추가됨 */}
      {COUPON_LIST.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-gray-500">현재 진행 중인 쿠폰이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {COUPON_LIST.map((coupon) => (
            <CouponIssueCard key={coupon.couponId} coupon={coupon} />
          ))}
        </div>
      )}

    </div>
  )
}

export default CouponIssuePage
