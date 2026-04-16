// 쿠폰 관련 API - 쿠폰 발급, 생성 (관리자), 전체 목록 조회
import apiClient from './client'
import type {
  IssueCouponResponse,
  CreateCouponRequest,
  CreateCouponResponse,
  GetCouponResponse,
  SliceResponse,
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
  return unwrap(response.data)
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
