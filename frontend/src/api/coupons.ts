// 쿠폰 관련 API - 쿠폰 발급, 생성 (관리자), 전체 목록 조회, 메트릭스
import apiClient from './client'
import type {
  IssueCouponResponse,
  CreateCouponRequest,
  CreateCouponResponse,
  GetCouponResponse,
  SliceResponse,
  CouponMetrics,
  CouponMetricsError,
} from '../types/coupon'

/** 백엔드 공통 응답 래퍼 */
interface ApiWrapper<T> {
  data: T
  code: string
  message: string
}

function unwrap<T>(data: ApiWrapper<T> | T): T {
  const d = data as ApiWrapper<T>
  return d?.data !== undefined ? d.data : (data as T)
}

// 공개 쿠폰 목록 조회 (GET /api/coupons)
export const getAllCoupons = async (page = 0, size = 10): Promise<SliceResponse<GetCouponResponse>> => {
  const response = await apiClient.get<ApiWrapper<SliceResponse<GetCouponResponse>>>('/coupons', {
    params: { page, size },
  })
  console.log('[getAllCoupons] raw response.data:', response.data)
  const result = unwrap(response.data)
  console.log('[getAllCoupons] unwrapped:', result)
  return result
}

// 쿠폰 발급
export const issueCoupon = async (couponId: number): Promise<IssueCouponResponse> => {
  const response = await apiClient.post<ApiWrapper<IssueCouponResponse>>(`/coupons/${couponId}/issue`)
  return unwrap(response.data)
}

// 쿠폰 생성 (관리자)
export const createCoupon = async (data: CreateCouponRequest): Promise<CreateCouponResponse> => {
  const response = await apiClient.post<ApiWrapper<CreateCouponResponse>>('/admin/coupons', data)
  return unwrap(response.data)
}

/**
 * 쿠폰 메트릭스 조회 (관리자)
 * GET /api/admin/coupons/{couponId}/metrics
 * 성공: CouponMetrics / 실패: CouponMetricsError
 */
export const getCouponMetrics = async (
  couponId: number
): Promise<CouponMetrics | CouponMetricsError> => {
  const response = await apiClient.get<ApiWrapper<CouponMetrics | CouponMetricsError>>(
    `/admin/coupons/${couponId}/metrics`
  )
  return unwrap(response.data)
}
