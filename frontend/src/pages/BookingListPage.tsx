/**
 * BookingListPage — 내 예매 내역 화면
 *
 * 구성 요소:
 * 1. 상태 필터 탭 (전체 / 예매 완료 / 결제 대기 / 취소됨)
 * 2. 주문 카드 목록
 * 3. 페이지네이션
 * 4. 취소 확인 모달
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyBookings } from '@/api/users'
import { cancelOrder } from '@/api/orders'
import type { OrderSummary, BookingListParams } from '@/types/user'
import type { AxiosError } from 'axios'
import {
  Button,
  EmptyState,
  LoadingSpinner,
  Modal,
  Pagination,
  StatusBadge,
} from '@/components'
import { useToast } from '@/components/Toast'

// ─── 상수 ────────────────────────────────────────────────────

type StatusFilter = 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED'

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: '전체',     value: 'ALL' },
  { label: '예매 완료', value: 'CONFIRMED' },
  { label: '결제 대기', value: 'PENDING' },
  { label: '취소됨',   value: 'CANCELLED' },
]

const PAGE_SIZE = 5

// ─── 유틸 ────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  })

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`

/**
 * 취소 가능 여부 판단
 * - CONFIRMED 상태이고 공연 시작 24시간 전까지만 취소 가능
 * - eventDate 정보가 없으면 버튼 노출 (서버에서 최종 검증)
 */
function isCancellable(order: OrderSummary): boolean {
  if (order.status !== 'CONFIRMED') return false
  const deadline = new Date(order.eventDate).getTime() - 24 * 60 * 60 * 1000
  return Date.now() < deadline
}

// ─── 에러 코드 → 메시지 ──────────────────────────────────────

function getCancelErrorMessage(error: unknown): string {
  const code = (error as AxiosError<{ code: string }>).response?.data?.code
  switch (code) {
    case 'CANCEL_PERIOD_EXPIRED':    return '취소 가능 기간이 지났습니다. (공연 시작 24시간 전까지)'
    case 'ORDER_ALREADY_CANCELLED':  return '이미 취소된 주문입니다.'
    case 'ORDER_NOT_OWNED':          return '본인의 주문만 취소할 수 있습니다.'
    default:                         return '취소 처리 중 오류가 발생했습니다.'
  }
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────

/** 주문 카드 */
function OrderCard({
  order,
  onCancel,
}: {
  order: OrderSummary
  onCancel: (order: OrderSummary) => void
}) {
  const cancellable = isCancellable(order)

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">

      {/* 카드 헤더 — 주문번호 + 상태 배지 */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400 font-mono">
          주문번호 #{order.orderId}
        </span>
        <StatusBadge status={order.status} />
      </div>

      {/* 공연 정보 */}
      <div>
        <h3 className="text-base font-bold text-gray-900 leading-snug">
          {order.eventTitle}
        </h3>
        <div className="mt-1 space-y-0.5 text-sm text-gray-500">
          <p>📅 {formatDate(order.eventDate)}</p>
          <p>📍 {order.venueName}</p>
        </div>
      </div>

      {/* 좌석 목록 */}
      <ul className="space-y-1">
        {order.items.map((item) => (
          <li key={item.seatNumber} className="flex justify-between text-sm">
            <span className="text-gray-600">
              <span className="font-medium">{item.sectionName}</span> · {item.seatNumber}
            </span>
            <span className="text-gray-400">{formatPrice(item.originalPrice)}</span>
          </li>
        ))}
      </ul>

      {/* 금액 요약 */}
      <div className="rounded-lg bg-gray-50 px-4 py-3 space-y-1 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>좌석 금액</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-blue-600">
            <span>할인 금액</span>
            <span>- {formatPrice(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
          <span>최종 결제 금액</span>
          <span className="text-blue-600">{formatPrice(order.finalAmount)}</span>
        </div>
      </div>

      {/* 예매일 */}
      <p className="text-xs text-gray-400">
        예매일: {formatDate(order.createdAt)}
      </p>

      {/* 버튼 영역 */}
      {cancellable && (
        <div className="flex justify-end">
          <Button
            variant="danger"
            size="small"
            onClick={() => onCancel(order)}
          >
            예매 취소
          </Button>
        </div>
      )}

    </article>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function BookingListPage() {
  const navigate  = useNavigate()
  const { toast } = useToast()

  // 필터 + 페이지 상태
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [currentPage, setCurrentPage]   = useState(0)

  // 목록 상태
  const [orders, setOrders]       = useState<OrderSummary[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading]     = useState(true)

  // 취소 모달 상태
  const [cancelTarget, setCancelTarget]   = useState<OrderSummary | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  // 목록 조회
  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params: BookingListParams = {
        page: currentPage,
        size: PAGE_SIZE,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      }
      const res = await getMyBookings(params)
      setOrders(res.content ?? [])
      setTotalPages(res.totalPages ?? 0)
    } catch {
      toast.error('예매 내역을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // 필터 변경 시 페이지 초기화
  const handleFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter)
    setCurrentPage(0)
  }

  // 취소 확인
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    setCancelLoading(true)
    try {
      const res = await cancelOrder(cancelTarget.orderId)
      toast.success(`취소가 완료되었습니다. 환불 금액: ${formatPrice(res.refundAmount)}`)
      setCancelTarget(null)
      // 목록 재조회
      await fetchBookings()
    } catch (error) {
      toast.error(getCancelErrorMessage(error))
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">

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
        <h1 className="text-xl font-bold text-gray-900">내 예매 내역</h1>
      </div>

      {/* 상태 필터 탭 */}
      <div
        role="tablist"
        aria-label="예매 상태 필터"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={statusFilter === tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={[
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              statusFilter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState
          title="예매 내역이 없습니다"
          description={
            statusFilter === 'ALL'
              ? '아직 예매한 티켓이 없어요'
              : `${STATUS_TABS.find((t) => t.value === statusFilter)?.label} 내역이 없습니다`
          }
          actionLabel="공연 보러가기"
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onCancel={setCancelTarget}
            />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* 취소 확인 모달 */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="예매를 취소하시겠습니까?"
        confirmLabel="예매 취소"
        cancelLabel="돌아가기"
        confirmVariant="danger"
        loading={cancelLoading}
      >
        {cancelTarget && (
          <div className="space-y-2">
            <p className="font-medium text-gray-800">{cancelTarget.eventTitle}</p>
            <p className="text-gray-500">{formatDate(cancelTarget.eventDate)}</p>
            <p className="text-gray-500">{cancelTarget.venueName}</p>
            <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              취소 후에는 되돌릴 수 없으며, 환불은 영업일 기준 3~5일 소요됩니다.
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}

export default BookingListPage
