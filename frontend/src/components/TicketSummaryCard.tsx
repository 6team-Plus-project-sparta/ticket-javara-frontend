/**
 * TicketSummaryCard 컴포넌트
 * - 예매 확인 / 결제 페이지에서 주문 내용을 요약해서 보여주는 카드
 * - 공연명, 공연일시, 장소, 좌석 목록, 원가 합계, 할인 금액, 최종 결제 금액 표시
 */

interface SeatItem {
  seatNumber: string
  sectionName: string
  originalPrice: number
}

interface TicketSummaryCardProps {
  eventTitle: string
  eventDate: string
  venueName: string
  seats: SeatItem[]
  totalAmount: number
  discountAmount?: number
  finalAmount: number
}

/** 숫자를 한국 원화 형식으로 변환 (예: 110000 → 110,000원) */
const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`

/** ISO 날짜 문자열을 읽기 좋은 형식으로 변환 */
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function TicketSummaryCard({
  eventTitle,
  eventDate,
  venueName,
  seats,
  totalAmount,
  discountAmount = 0,
  finalAmount,
}: TicketSummaryCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* 공연 정보 */}
      <h3 className="text-base font-bold text-gray-900">{eventTitle}</h3>
      <div className="mt-2 space-y-1 text-sm text-gray-500">
        <p>📅 {formatDate(eventDate)}</p>
        <p>📍 {venueName}</p>
      </div>

      <hr className="my-4 border-gray-100" />

      {/* 좌석 목록 */}
      <ul className="space-y-1.5">
        {seats.map((seat) => (
          <li key={seat.seatNumber} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">
              <span className="font-medium">{seat.sectionName}</span> · {seat.seatNumber}
            </span>
            <span className="text-gray-500">{formatPrice(seat.originalPrice)}</span>
          </li>
        ))}
      </ul>

      <hr className="my-4 border-gray-100" />

      {/* 금액 요약 */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>원가 합계</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-blue-600">
            <span>할인 금액</span>
            <span>- {formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-100">
          <span>최종 결제 금액</span>
          <span className="text-blue-600">{formatPrice(finalAmount)}</span>
        </div>
      </div>
    </div>
  )
}

export default TicketSummaryCard
