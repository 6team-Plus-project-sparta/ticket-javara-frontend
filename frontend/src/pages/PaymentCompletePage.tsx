/**
 * PaymentCompletePage — 결제 완료 화면 (SCR-008)
 *
 * 진입 경로 3가지:
 * [A] 토스 성공 리다이렉트: ?paymentKey=xxx&amount=yyy  → 승인 API 호출 후 폴링
 * [B] 토스 실패 리다이렉트: ?failed=true               → 바로 실패 화면
 * [C] navigate 진입 (기존 Mock PG 방식)               → 바로 폴링
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getOrder, confirmTossPayment } from '@/api/orders'
import type { OrderDetail } from '@/types/order'
import { Button, LoadingSpinner } from '@/components'

const POLL_INTERVAL_MS = 2000
const POLL_MAX_COUNT   = 15

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`
const formatDate  = (dateStr: string) =>
    new Date(dateStr).toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
        weekday: 'short', hour: '2-digit', minute: '2-digit',
    })

// ─── 서브 컴포넌트 ────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
    const steps = ['좌석 선택', '결제', '예매 완료']
    return (
        <ol className="flex items-center" aria-label="예매 진행 단계">
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
                      done || active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400',
                      active ? 'ring-4 ring-blue-100' : '',
                  ].join(' ')}
              >
                {done ? '✓' : step}
              </span>
                            <span className={['text-xs', active ? 'font-semibold text-blue-600' : 'text-gray-400'].join(' ')}>
                {label}
              </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={['mx-2 mb-5 h-0.5 w-12 sm:w-20', done || active ? 'bg-blue-600' : 'bg-gray-200'].join(' ')} aria-hidden="true" />
                        )}
                    </li>
                )
            })}
        </ol>
    )
}

function PollingView({ pollCount, message }: { pollCount: number; message: string }) {
    return (
        <div className="flex flex-col items-center gap-4 py-16">
            <LoadingSpinner size="large" />
            <p className="text-sm font-medium text-gray-700">{message}</p>
            <p className="text-xs text-gray-400">잠시만 기다려주세요. ({pollCount}/{POLL_MAX_COUNT})</p>
        </div>
    )
}

function TimeoutView({ orderId }: { orderId: number }) {
    return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <p className="text-base font-bold text-gray-800">결제 확인이 지연되고 있습니다</p>
                <p className="mt-1 text-sm text-gray-500">결제가 완료됐다면 예매 내역에서 확인할 수 있습니다.</p>
                <p className="mt-1 text-xs text-gray-400">주문번호: #{orderId}</p>
            </div>
            <div className="flex gap-3">
                <Link to="/mypage/bookings"><Button>내 예매 내역 보기</Button></Link>
                <Link to="/"><Button variant="secondary">홈으로</Button></Link>
            </div>
        </div>
    )
}

function FailedView({ message }: { message?: string }) {
    return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <div>
                <p className="text-base font-bold text-gray-800">결제에 실패했습니다</p>
                <p className="mt-1 text-sm text-gray-500">{message ?? '다시 시도하거나 고객센터에 문의해주세요.'}</p>
            </div>
            <div className="flex gap-3">
                <Link to="/"><Button>홈으로 돌아가기</Button></Link>
                <Link to="/chat"><Button variant="ghost">고객센터 문의</Button></Link>
            </div>
        </div>
    )
}

function ConfirmedView({ order }: { order: OrderDetail }) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <p className="text-xl font-extrabold text-gray-900">예매가 완료되었습니다!</p>
                    <p className="mt-1 text-sm text-gray-500">
                        주문번호: <span className="font-mono font-semibold text-gray-700">#{order.orderId}</span>
                    </p>
                </div>
            </div>

            <section aria-labelledby="order-summary-heading" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <h2 id="order-summary-heading" className="text-sm font-bold text-gray-800">예매 내역</h2>
                <ul className="space-y-3">
                    {order.bookings.map((booking) => (
                        <li key={booking.bookingId} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{booking.seatInfo}</p>
                                    <p className="mt-0.5 font-mono text-xs text-gray-400">{booking.ticketCode}</p>
                                </div>
                                <span className="shrink-0 text-sm font-medium text-gray-600">{formatPrice(booking.originalPrice)}</span>
                            </div>
                        </li>
                    ))}
                </ul>
                <hr className="border-gray-100" />
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-500">
                        <span>좌석 금액</span>
                        <span>{formatPrice(order.totalAmount)}</span>
                    </div>
                    {order.couponUsed && (
                        <div className="flex justify-between text-blue-600">
                            <span>쿠폰 할인 ({order.couponUsed.couponName})</span>
                            <span>- {formatPrice(order.couponUsed.discountAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-extrabold text-gray-900">
                        <span>최종 결제 금액</span>
                        <span className="text-blue-600">{formatPrice(order.finalAmount)}</span>
                    </div>
                </div>
                {order.payment && (
                    <>
                        <hr className="border-gray-100" />
                        <div className="space-y-1 text-xs text-gray-400">
                            <div className="flex justify-between">
                                <span>결제 수단</span>
                                <span className="text-gray-600">{order.payment.method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>결제 일시</span>
                                <span className="text-gray-600">{formatDate(order.payment.paidAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>결제 키</span>
                                <span className="font-mono text-gray-500 truncate max-w-[180px]">{order.payment.paymentKey}</span>
                            </div>
                        </div>
                    </>
                )}
            </section>

            <p className="text-center text-xs text-gray-400">취소는 공연 시작 24시간 전까지 예매 내역에서 가능합니다.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/mypage/bookings" className="flex-1">
                    <Button size="large" className="w-full">내 예매 내역 보기</Button>
                </Link>
                <Link to="/" className="flex-1">
                    <Button size="large" variant="secondary" className="w-full">홈으로 돌아가기</Button>
                </Link>
            </div>
        </div>
    )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

type PagePhase =
    | 'confirming'  // 토스 승인 API 호출 중
    | 'polling'     // CONFIRMED 폴링 중
    | 'confirmed'   // 완료
    | 'failed'      // 실패
    | 'timeout'     // 폴링 타임아웃

// React StrictMode 이중 실행 방지 — 모듈 레벨로 관리
const calledKeys = new Set<string>()

function PaymentCompletePage() {
    const { orderId: orderIdParam } = useParams<{ orderId: string }>()
    const [searchParams]            = useSearchParams()
    const navigate                  = useNavigate()

    const orderId    = orderIdParam ? Number(orderIdParam) : null
    const paymentKey = searchParams.get('paymentKey')
    const amount     = searchParams.get('amount')
    const failed     = searchParams.get('failed')
    const tossOrderId = searchParams.get('tossOrderId') ?? `ORDER-${orderId}`

    const [phase, setPhase]             = useState<PagePhase>('polling')
    const [order, setOrder]             = useState<OrderDetail | null>(null)
    const [pollCount, setPollCount]     = useState(0)
    const [failMessage, setFailMessage] = useState<string>()

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!orderId) { navigate('/', { replace: true }); return }

        // [B] 실패 리다이렉트
        if (failed === 'true') {
            setPhase('failed')
            setFailMessage('결제가 취소되었거나 실패하였습니다.')
            return
        }

        // [A] 토스 성공 리다이렉트 — 승인 API 호출 후 폴링
        if (paymentKey && amount) {
            const callKey = `${orderId}-${paymentKey}`
            if (calledKeys.has(callKey)) return  // StrictMode 이중 호출 방지
            calledKeys.add(callKey)

            setPhase('confirming')
            confirmTossPayment({ paymentKey, orderId, amount: Number(amount), tossOrderId })
                .then(() => {
                    setPhase('polling')
                    startPolling(orderId)
                })
                .catch(() => {
                    setPhase('failed')
                    setFailMessage('결제 승인 중 오류가 발생했습니다. 예매 내역을 확인해주세요.')
                })
            return
        }

        // [C] navigate 진입 — 바로 폴링
        startPolling(orderId)

        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [orderId]) // eslint-disable-line react-hooks/exhaustive-deps

    function startPolling(id: number) {
        let count = 0
        const poll = async () => {
            try {
                const data = await getOrder(id)
                setOrder(data)
                if (data.status === 'CONFIRMED') { setPhase('confirmed'); return }
                if (data.status === 'CANCELLED') { setPhase('failed');    return }
                count += 1
                setPollCount(count)
                if (count >= POLL_MAX_COUNT) { setPhase('timeout'); return }
                timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
            } catch {
                count += 1
                setPollCount(count)
                if (count < POLL_MAX_COUNT) {
                    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
                } else {
                    setPhase('timeout')
                }
            }
        }
        poll()
    }

    if (!orderId) return null

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div className="flex justify-center pt-2">
                <StepIndicator current={3} />
            </div>
            {phase === 'confirming' && <PollingView pollCount={0} message="결제 승인 중입니다..." />}
            {phase === 'polling'    && <PollingView pollCount={pollCount} message="결제 확인 중입니다..." />}
            {phase === 'timeout'    && <TimeoutView orderId={orderId} />}
            {phase === 'failed'     && <FailedView message={failMessage} />}
            {phase === 'confirmed'  && order && <ConfirmedView order={order} />}
        </div>
    )
}

export default PaymentCompletePage