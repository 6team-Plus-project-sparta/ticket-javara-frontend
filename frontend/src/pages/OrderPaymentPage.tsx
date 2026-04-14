/**
 * OrderPaymentPage — 주문·결제 화면 (SCR-007)
 *
 * 진입 조건:
 *   SeatSelectionPage에서 navigate('/orders/payment', { state: { holdTokens, selectedSeats, eventId } })
 *   로 전달받은 데이터를 사용한다.
 *
 * 구성 요소:
 * 1. 스텝 인디케이터 (좌석 선택 → 결제 → 완료)
 * 2. 남은 결제 시간 CountdownTimer
 * 3. 예매 좌석 확인 (TicketSummaryCard)
 * 4. 쿠폰 선택 영역
 * 5. 결제 금액 요약
 * 6. 결제하기 버튼
 */

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getMyCoupons } from '@/api/users'
import { createOrder } from '@/api/orders'
import type { UserCoupon } from '@/types/user'
import type { AxiosError } from 'axios'
import { Button, CountdownTimer, Modal, TicketSummaryCard } from '@/components'
import { useToast } from '@/components/Toast'

// ─── 타입 ────────────────────────────────────────────────────

/** SeatSelectionPage에서 navigate state로 전달받는 데이터 */
interface PaymentLocationState {
  holdTokens: string[]
  selectedSeats: {
    seatId: number
    seatNumber: string
    sectionName: string
    price: number
    holdToken: string
    expiresAt: string
  }[]
  eventId: number
  /** 이벤트 기본 정보 (선택적 — 없으면 fallback 표시) */
  eventTitle?: string
  eventDate?: string
  venueName?: string
}

// ─── 유틸: 금액 계산 ─────────────────────────────────────────

/**
 * 결제 금액 계산 유틸
 * @param seats      선택한 좌석 목록
 * @param coupon     선택한 쿠폰 (없으면 null)
 * @returns          { totalAmount, discountAmount, finalAmount }
 */
export function calcPaymentAmount(
  seats: { price: number }[],
  coupon: UserCoupon | null,
): { totalAmount: number; discountAmount: number; finalAmount: number } {
  const totalAmount    = seats.reduce((sum, s) => sum + s.price, 0)
  const discountAmount = coupon?.discountAmount ?? 0
  const finalAmount    = Math.max(0, totalAmount - discountAmount)
  return { totalAmount, discountAmount, finalAmount }
}

// ─── 에러 코드 → 메시지 ──────────────────────────────────────

function getOrderErrorMessage(error: unknown): string {
  const code = (error as AxiosError<{ code: string }>).response?.data?.code
  switch (code) {
    case 'HOLD_EXPIRED':      return '좌석을 다시 선택해주세요.'
    case 'COUPON_INVALID':    return '사용할 수 없는 쿠폰입니다.'
    case 'COUPON_NOT_OWNED':  return '본인 소유의 쿠폰만 사용할 수 있습니다.'
    default:                  return '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────

/** 스텝 인디케이터 */
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['좌석 선택', '결제', '예매 완료']
  return (
    <ol className="flex items-center gap-0" aria-label="예매 진행 단계">
      {steps.map((label, i) => {
        const step  = (i + 1) as 1 | 2 | 3
        const done  = step < current
        const active = step === current
        return (
          <li key={label} className="flex items-center">
            {/* 원 */}
            <div className="flex flex-col items-center gap-1">
              <span
                aria-current={active ? 'step' : undefined}
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                  done   ? 'bg-blue-600 text-white' :
                  active ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                           'bg-gray-100 text-gray-400',
                ].join(' ')}
              >
                {done ? '✓' : step}
              </span>
              <span className={['text-xs', active ? 'font-semibold text-blue-600' : 'text-gray-400'].join(' ')}>
                {label}
              </span>
            </div>
            {/* 연결선 */}
            {i < steps.length - 1 && (
              <div className={['mx-2 mb-5 h-0.5 w-12 sm:w-20', done ? 'bg-blue-600' : 'bg-gray-200'].join(' ')} aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 쿠폰 선택 영역 */
function CouponSelector({
  coupons,
  loading,
  selectedId,
  onSelect,
}: {
  coupons: UserCoupon[]
  loading: boolean
  selectedId: number | null
  onSelect: (coupon: UserCoupon | null) => void
}) {
  const usable = coupons.filter((c) => c.status === 'ISSUED')

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-gray-800">쿠폰 선택</h2>

      {loading ? (
        <p className="text-sm text-gray-400">쿠폰 목록을 불러오는 중...</p>
      ) : usable.length === 0 ? (
        <p className="text-sm text-gray-400">사용 가능한 쿠폰이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {/* 쿠폰 미사용 옵션 */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="coupon"
              checked={selectedId === null}
              onChange={() => onSelect(null)}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-500">쿠폰 사용 안 함</span>
          </label>

          {usable.map((coupon) => (
            <label
              key={coupon.userCouponId}
              className={[
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                selectedId === coupon.userCouponId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 hover:bg-gray-50',
              ].join(' ')}
            >
              <input
                type="radio"
                name="coupon"
                checked={selectedId === coupon.userCouponId}
                onChange={() => onSelect(coupon)}
                className="accent-blue-600"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{coupon.couponName}</p>
                <p className="text-xs text-gray-400">
                  만료: {new Date(coupon.expiredAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-blue-600">
                -{coupon.discountAmount.toLocaleString('ko-KR')}원
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function OrderPaymentPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { toast } = useToast()

  // SeatSelectionPage에서 전달받은 state
  const state = location.state as PaymentLocationState | null

  // state가 없으면 (직접 URL 접근 / 새로고침) 홈으로 이동
  // holdTokens는 메모리 state라 새로고침 시 복원 불가 — 좌석 선택부터 다시 해야 함
  useEffect(() => {
    if (!state?.holdTokens?.length) {
      toast.error('결제 정보가 없습니다. 좌석을 다시 선택해주세요.')
      navigate(-1)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 쿠폰 상태
  const [coupons, setCoupons]           = useState<UserCoupon[]>([])
  const [couponsLoading, setCouponsLoading] = useState(true)
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null)

  // 결제 요청 로딩
  const [payLoading, setPayLoading] = useState(false)

  // 타이머 만료 모달
  const [expireModalOpen, setExpireModalOpen] = useState(false)
  const expiredRef = useRef(false)

  // 쿠폰 목록 조회
  useEffect(() => {
    getMyCoupons()
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setCouponsLoading(false))
  }, [])

  // state가 없는 경우 렌더링 방지
  if (!state?.holdTokens?.length) return null

  const { holdTokens, selectedSeats, eventId } = state
  const eventTitle = state.eventTitle ?? '공연 정보 없음'
  const eventDate  = state.eventDate  ?? new Date().toISOString()
  const venueName  = state.venueName  ?? '-'

  // 가장 빠른 expiresAt (타이머 기준)
  const earliestExpiresAt = selectedSeats.reduce((min, s) =>
    new Date(s.expiresAt) < new Date(min) ? s.expiresAt : min,
    selectedSeats[0].expiresAt
  )

  // 금액 계산 (쿠폰 선택 시 즉시 반영 — 서버 호출 없음)
  const { totalAmount, discountAmount, finalAmount } = calcPaymentAmount(
    selectedSeats,
    selectedCoupon,
  )

  // TicketSummaryCard용 좌석 데이터 변환
  const summarySeats = selectedSeats.map((s) => ({
    seatNumber:    s.seatNumber,
    sectionName:   s.sectionName,
    originalPrice: s.price,
  }))

  // 타이머 만료
  const handleExpire = () => {
    if (expiredRef.current) return
    expiredRef.current = true
    setExpireModalOpen(true)
  }

  // 만료 모달 확인 → 좌석 선택 화면으로 이동
  const handleExpireConfirm = () => {
    navigate(`/events/${eventId}/seats`, { replace: true })
  }

  // 결제하기
  const handlePayment = async () => {
    setPayLoading(true)
    try {
      const res = await createOrder({
        holdTokens,
        ...(selectedCoupon && { couponId: selectedCoupon.userCouponId }),
      })
      // 성공 → 완료 페이지로 이동 (orderId 전달)
      navigate(`/orders/${res.orderId}/complete`, {
        replace: true,
        state: { orderId: res.orderId },
      })
    } catch (error) {
      const msg = getOrderErrorMessage(error)
      toast.error(msg)

      // Hold 만료 에러면 좌석 선택으로 유도
      const code = (error as AxiosError<{ code: string }>).response?.data?.code
      if (code === 'HOLD_EXPIRED') {
        setExpireModalOpen(true)
      }
    } finally {
      setPayLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* 스텝 인디케이터 */}
      <div className="flex justify-center pt-2">
        <StepIndicator current={2} />
      </div>

      {/* 페이지 헤더 + 타이머 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">결제</h1>
        <CountdownTimer
          expiresAt={earliestExpiresAt}
          onExpire={handleExpire}
        />
      </div>

      {/* 예매 좌석 확인 — TicketSummaryCard 재사용 */}
      <section aria-labelledby="ticket-summary-heading">
        <h2 id="ticket-summary-heading" className="mb-2 text-sm font-bold text-gray-700">
          예매 좌석 확인
        </h2>
        <TicketSummaryCard
          eventTitle={eventTitle}
          eventDate={eventDate}
          venueName={venueName}
          seats={summarySeats}
          totalAmount={totalAmount}
          discountAmount={discountAmount}
          finalAmount={finalAmount}
        />
      </section>

      {/* 쿠폰 선택 */}
      <section aria-labelledby="coupon-heading">
        <h2 id="coupon-heading" className="sr-only">쿠폰 선택</h2>
        <CouponSelector
          coupons={coupons}
          loading={couponsLoading}
          selectedId={selectedCoupon?.userCouponId ?? null}
          onSelect={setSelectedCoupon}
        />
      </section>

      {/* 최종 결제 금액 요약 */}
      <section
        aria-labelledby="payment-summary-heading"
        className="rounded-xl border border-blue-100 bg-blue-50 p-5"
      >
        <h2 id="payment-summary-heading" className="mb-3 text-sm font-bold text-gray-800">
          결제 금액
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>좌석 금액 ({selectedSeats.length}석)</span>
            <span>{totalAmount.toLocaleString('ko-KR')}원</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>쿠폰 할인 ({selectedCoupon?.couponName})</span>
              <span>- {discountAmount.toLocaleString('ko-KR')}원</span>
            </div>
          )}
          <div className="flex justify-between border-t border-blue-200 pt-2 text-base font-extrabold text-gray-900">
            <span>최종 결제 금액</span>
            <span className="text-blue-600">{finalAmount.toLocaleString('ko-KR')}원</span>
          </div>
        </div>
      </section>

      {/* 결제하기 버튼 */}
      <Button
        size="large"
        className="w-full"
        loading={payLoading}
        onClick={handlePayment}
      >
        {finalAmount.toLocaleString('ko-KR')}원 결제하기
      </Button>

      {/* 안내 문구 */}
      <p className="text-center text-xs text-gray-400">
        결제 완료 후 취소는 공연 시작 24시간 전까지 가능합니다.
      </p>

      {/* 타이머 만료 / Hold 만료 모달 */}
      <Modal
        isOpen={expireModalOpen}
        onClose={handleExpireConfirm}
        onConfirm={handleExpireConfirm}
        title="좌석 선점 시간이 만료되었습니다"
        confirmLabel="좌석 다시 선택하기"
        cancelLabel="닫기"
        confirmVariant="primary"
      >
        <p>선점 시간이 초과되어 선택한 좌석이 해제되었습니다.</p>
        <p className="mt-1 text-gray-400">좌석 선택 화면으로 돌아가 다시 선택해주세요.</p>
      </Modal>

    </div>
  )
}

export default OrderPaymentPage
