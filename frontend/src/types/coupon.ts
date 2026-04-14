// 쿠폰 관련 타입 정의 - 쿠폰 생성, 발급 요청 및 응답

export interface CreateCouponRequest {
  name: string
  discountAmount: number
  totalQuantity: number
  startAt: string
  expiredAt: string
}

export interface CreateCouponResponse {
  couponId: number
  name: string
  totalQuantity: number
  remainingQuantity: number
  startAt: string
  expiredAt: string
}

export interface IssueCouponResponse {
  message: string
  userCouponId: number
  couponName: string
  discountAmount: number
  expiredAt: string
}
