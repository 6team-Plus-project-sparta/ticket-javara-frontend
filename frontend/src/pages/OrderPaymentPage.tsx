/**
 * OrderPaymentPage — 주문·결제 화면 (SCR-007)
 *
 * 토스페이먼츠 테스트 모드 연동:
 *   1. POST /api/orders → orderId 확보
 *   2. 토스 결제창(TossPayments) 호출 → 카드 입력
 *   3. 결제 성공 시 successUrl(/orders/:id/complete?paymentKey=...&amount=...)로 리다이렉트
 *   4. 실패 시 failUrl(/orders/:id/complete?failed=true)로 리다이렉트
 */

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getMyCoupons } from '@/api/users'
import { createOrder } from '@/api/orders'
import type { UserCoupon } from '@/types/user'
import type { AxiosError } from 'axios'
import { Button, CountdownTimer, Modal, TicketSummaryCard } from '@/components'
import { useToast } from '@/components/Toast'

// ─── 토스페이먼츠 SDK 타입 선언 ──────────────────────────────
// CDN 방식으로 로드하므로 window 전역 함수로 선언
declare global {
  interface Window {
    TossPayments: (clientKey: string) => TossPaymentsInstance
  }
}

interface TossPaymentsInstance {
  requestPayment: (method: string, options: TossPaymentOptions) => Promise<void>
}

interface TossPaymentOptions {
  amount: number
  orderId: string
  orderName: string
  customerName?: string
  successUrl: string
  failUrl: string
}

// ─── 토스 SDK 동적 로드 ──────────────────────────────────────
function loadTossScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('toss-payments-sdk')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = 'toss-payments-sdk'
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.type = 'module'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'))
    document.head.appendChild(script)
  })
}

// ─── 타입 ────────────────────────────────────────────────────

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
  eventTitle?: string
  eventDate?: string
  venueName?: string
}

// ─── 유틸 ────────────────────────────────────────────────────

function calcPaymentAmount(
    seats: { price: number }[],
    coupon: UserCoupon | null,
): { totalAmount: number; discountAmount: number; finalAmount: number } {
  const totalAmount    = seats.reduce((sum, s) => sum + s.price, 0)
  const discountAmount = coupon?.discountAmount ?? 0
  const finalAmount    = Math.max(0, totalAmount - discountAmount)
  return { totalAmount, discountAmount, finalAmount }
}

function getOrderErrorMessage(error: unknown): string {
  const code = (error as AxiosError<{ code: string }>).response?.data?.code
  switch (code) {
    case 'HOLD_EXPIRED':     return '좌석 선점 시간이 만료되었습니다. 다시 선택해주세요.'
    case 'COUPON_INVALID':   return '사용할 수 없는 쿠폰입니다.'
    case 'COUPON_NOT_OWNED': return '본인 소유의 쿠폰만 사용할 수 있습니다.'
    default:                  return '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['좌석 선택', '결제', '예매 완료']
  return (
      <ol className="flex items-center gap-0" aria-label="예매 진행 단계">
        {steps.map((label, i) => {
          const step   = (i + 1) as 1 | 2 | 3
          const done   = step < current
          const active = step === current
          return (
              <li key={label} className="flex items-center">
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
                {i < steps.length - 1 && (
                    <div className={['mx-2 mb-5 h-0.5 w-12 sm:w-20', done ? 'bg-blue-600' : 'bg-gray-200'].join(' ')} aria-hidden="true" />
                )}
              </li>
          )
        })}
      </ol>
  )
}

function CouponSelector({
                          coupons, loading, selectedId, onSelect,
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
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                <input type="radio" name="coupon" checked={selectedId === null} onChange={() => onSelect(null)} className="accent-blue-600" />
                <span className="text-sm text-gray-500">쿠폰 사용 안 함</span>
              </label>
              {usable.map((coupon) => (
                  <label
                      key={coupon.userCouponId}
                      className={[
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                        selectedId === coupon.userCouponId ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50',
                      ].join(' ')}
                  >
                    <input type="radio" name="coupon" checked={selectedId === coupon.userCouponId} onChange={() => onSelect(coupon)} className="accent-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{coupon.couponName}</p>
                      <p className="text-xs text-gray-400">만료: {new Date(coupon.expiredAt).toLocaleDateString('ko-KR')}</p>
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

  const state = location.state as PaymentLocationState | null

  useEffect(() => {
    if (!state?.holdTokens?.length) {
      toast.error('결제 정보가 없습니다. 좌석을 다시 선택해주세요.')
      navigate(-1)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [coupons, setCoupons]               = useState<UserCoupon[]>([])
  const [couponsLoading, setCouponsLoading] = useState(true)
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null)
  const [payLoading, setPayLoading]         = useState(false)
  const [expireModalOpen, setExpireModalOpen] = useState(false)
  const expiredRef = useRef(false)

  useEffect(() => {
    getMyCoupons()
        .then(setCoupons)
        .catch(() => setCoupons([]))
        .finally(() => setCouponsLoading(false))
  }, [])

  if (!state?.holdTokens?.length) return null

  const { holdTokens, selectedSeats, eventId } = state
  const eventTitle = state.eventTitle ?? '공연 정보 없음'
  const eventDate  = state.eventDate  ?? new Date().toISOString()
  const venueName  = state.venueName  ?? '-'

  const earliestExpiresAt = selectedSeats.reduce((min, s) =>
          new Date(s.expiresAt) < new Date(min) ? s.expiresAt : min,
      selectedSeats[0].expiresAt
  )

  const { totalAmount, discountAmount, finalAmount } = calcPaymentAmount(selectedSeats, selectedCoupon)

  const summarySeats = selectedSeats.map((s) => ({
    seatNumber:    s.seatNumber,
    sectionName:   s.sectionName,
    originalPrice: s.price,
  }))

  const handleExpire = () => {
    if (expiredRef.current) return
    expiredRef.current = true
    setExpireModalOpen(true)
  }

  const handleExpireConfirm = () => {
    navigate(`/events/${eventId}/seats`, { replace: true })
  }

  // ─── 토스페이먼츠 결제 요청 ──────────────────────────────────
  const handlePayment = async () => {
    setPayLoading(true)
    try {
      // 1. 백엔드에 주문 생성 → orderId 확보
      const order = await createOrder({
        holdTokens,
        ...(selectedCoupon && { userCouponId: selectedCoupon.userCouponId }),
      })

      // 2. 토스 SDK 스크립트 동적 로드
      await loadTossScript()

      // 3. 클라이언트 키로 인스턴스 생성
      const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY
      if (!clientKey) throw new Error('VITE_TOSS_CLIENT_KEY 환경변수가 없습니다.')

      const tossPayments = window.TossPayments(clientKey)

      // 4. 결제창 호출
      //    성공 → successUrl로 리다이렉트 (paymentKey, orderId, amount 쿼리파라미터 포함)
      //    실패 → failUrl로 리다이렉트 (failed=true 쿼리파라미터 포함)
      const tossOrderIdValue = `ORDER-${order.orderId}-${Date.now()}`

      await tossPayments.requestPayment('카드', {
        amount:     finalAmount,
        orderId:    tossOrderIdValue,
        orderName:  `${eventTitle} 티켓 ${selectedSeats.length}매`,
        successUrl: `${window.location.origin}/orders/${order.orderId}/complete?tossOrderId=${tossOrderIdValue}`,
        failUrl:    `${window.location.origin}/orders/${order.orderId}/complete?failed=true`,
      })

    } catch (error) {
      // 사용자가 결제창을 직접 닫은 경우 — 조용히 처리
      const errObj = error as { code?: string; message?: string }
      if (errObj?.code === 'USER_CANCEL') {
        setPayLoading(false)
        return
      }

      const msg = getOrderErrorMessage(error)
      toast.error(msg)

      const code = (error as AxiosError<{ code: string }>).response?.data?.code
      if (code === 'HOLD_EXPIRED') setExpireModalOpen(true)
    } finally {
      setPayLoading(false)
    }
  }

  return (
      <div className="mx-auto max-w-2xl space-y-6">

        <div className="flex justify-center pt-2">
          <StepIndicator current={2} />
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">결제</h1>
          <CountdownTimer expiresAt={earliestExpiresAt} onExpire={handleExpire} />
        </div>

        <section aria-labelledby="ticket-summary-heading">
          <h2 id="ticket-summary-heading" className="mb-2 text-sm font-bold text-gray-700">예매 좌석 확인</h2>
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

        <section aria-labelledby="coupon-heading">
          <h2 id="coupon-heading" className="sr-only">쿠폰 선택</h2>
          <CouponSelector
              coupons={coupons}
              loading={couponsLoading}
              selectedId={selectedCoupon?.userCouponId ?? null}
              onSelect={setSelectedCoupon}
          />
        </section>

        <section
            aria-labelledby="payment-summary-heading"
            className="rounded-xl border border-blue-100 bg-blue-50 p-5"
        >
          <h2 id="payment-summary-heading" className="mb-3 text-sm font-bold text-gray-800">결제 금액</h2>
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

        <Button size="large" className="w-full" loading={payLoading} onClick={handlePayment}>
          {finalAmount.toLocaleString('ko-KR')}원 카드 결제하기
        </Button>

        <p className="text-center text-xs text-gray-400">
          토스페이먼츠 테스트 결제 · 실제 청구되지 않습니다
        </p>

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