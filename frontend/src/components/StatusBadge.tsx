/**
 * StatusBadge 컴포넌트
 * - 이벤트 상태, 좌석 상태, 주문 상태 등 다양한 상태값을 색상 뱃지로 표시
 * - status: 상태값 문자열
 * - 알 수 없는 상태는 회색으로 fallback 처리
 */

type StatusValue =
  // 이벤트 판매 상태
  | 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED' | 'ENDED'
  // 좌석 상태
  | 'AVAILABLE' | 'ON_HOLD' | 'CONFIRMED'
  // 주문/예매 상태
  | 'PENDING' | 'FAILED'
  // 쿠폰 상태
  | 'ISSUED' | 'USED' | 'EXPIRED'

interface StatusBadgeProps {
  status: StatusValue | string
  className?: string
}

// 상태별 색상 + 한국어 라벨 매핑
const statusConfig: Record<string, { label: string; className: string }> = {
  // 이벤트
  ON_SALE:   { label: '예매 중',   className: 'bg-green-100 text-green-700' },
  SOLD_OUT:  { label: '매진',      className: 'bg-red-100 text-red-600' },
  CANCELLED: { label: '취소됨',    className: 'bg-gray-100 text-gray-500' },
  ENDED:     { label: '예매종료',  className: 'bg-gray-100 text-gray-500' },
  // 좌석
  AVAILABLE: { label: '선택 가능', className: 'bg-blue-100 text-blue-700' },
  ON_HOLD:   { label: '임시 선점', className: 'bg-yellow-100 text-yellow-700' },
  // 주문/예매
  PENDING:   { label: '결제 대기', className: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: '예매 완료', className: 'bg-green-100 text-green-700' },
  FAILED:    { label: '실패',      className: 'bg-red-100 text-red-600' },
  // 쿠폰
  ISSUED:    { label: '사용 가능', className: 'bg-blue-100 text-blue-700' },
  USED:      { label: '사용 완료', className: 'bg-gray-100 text-gray-500' },
  EXPIRED:   { label: '만료',      className: 'bg-gray-100 text-gray-400' },
}

function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-500' }

  return (
    <span className={['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className, className].join(' ')}>
      {config.label}
    </span>
  )
}

export default StatusBadge
