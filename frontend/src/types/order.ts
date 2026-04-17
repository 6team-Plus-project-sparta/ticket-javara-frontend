// 주문 관련 타입 정의 - 주문 생성/조회/취소 요청 및 응답

export interface CreateOrderRequest {
  holdTokens: string[]
  couponId?: number
}

export interface OrderItem {
  seatId: number
  seatNumber: string
  originalPrice: number
}

export interface CreateOrderResponse {
  orderId: number
  status: 'PENDING'
  totalAmount: number
  discountAmount: number
  finalAmount: number
  items: OrderItem[]
  pgRequestId: string
}

export interface BookingDetail {
  bookingId: number
  seatInfo: string
  originalPrice: number
  ticketCode: string | null
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING'
  /** 백엔드에서 추가된 이벤트 타이틀 */
  eventTitle?: string
}

export interface CouponUsed {
  userCouponId: number
  couponName: string
  discountAmount: number
}

export interface PaymentInfo {
  paymentKey: string
  method: string
  paidAmount: number
  paidAt: string
}

export interface OrderDetail {
  orderId: number
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING'
  totalAmount: number
  discountAmount: number
  finalAmount: number
  bookings: BookingDetail[]
  couponUsed: CouponUsed | null
  payment: PaymentInfo | null
  createdAt: string
  /** 백엔드에서 추가된 이벤트 타이틀 */
  eventTitle?: string
}

export interface CancelOrderResponse {
  message: string
  orderId: number
  refundAmount: number
}
