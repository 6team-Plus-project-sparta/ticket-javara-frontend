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

/** GET /api/admin/coupons/{couponId}/metrics 성공 응답 */
export interface CouponMetrics {
  couponId: number
  /** 총 발급 시도 횟수 */
  totalAttempts: number
  /** Redis DECR 성공 횟수 */
  redisSuccess: number
  /** DB fallback 처리 횟수 */
  dbFallback: number
  /** 성공률 (0.0 ~ 1.0) */
  successRate: number
  /** fallback 비율 (0.0 ~ 1.0) */
  fallbackRate: number
  createdAt: string
}

/** 메트릭스 조회 실패 응답 */
export interface CouponMetricsError {
  error: string
}
