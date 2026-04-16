// 쿠폰 관련 타입 정의

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

/** GET /api/coupons 응답 — 공개 쿠폰 캠페인 목록 */
export interface GetCouponResponse {
  couponId: number
  name: string
  discountAmount: number
  totalQuantity: number
  remainingQuantity: number
  startAt: string
  expiredAt: string
}

/** Slice 기반 페이지 응답 */
export interface SliceResponse<T> {
  content: T[]
  hasNext: boolean
  numberOfElements: number
  size: number
  number: number
}
