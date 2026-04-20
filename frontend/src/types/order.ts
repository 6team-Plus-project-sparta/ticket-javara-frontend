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
  ticketCode: string
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING'
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
}

export interface CancelOrderResponse {
  message: string
  orderId: number
  refundAmount: number
}

// ─── 토스페이먼츠 연동 타입 ───────────────────────────────────

/** 토스페이먼츠 결제 승인 요청 (프론트 → 백엔드) */
export interface ConfirmTossPaymentRequest {
  paymentKey: string
  orderId: number
  amount: number
}

/** 토스페이먼츠 결제 승인 응답 */
export interface ConfirmTossPaymentResponse {
  orderId: number
  paymentKey: string
  status: string
}