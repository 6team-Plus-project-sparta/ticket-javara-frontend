// 쿠폰 관련 API - 쿠폰 발급, 생성 (관리자)
import apiClient from './client'
import type { IssueCouponResponse, CreateCouponRequest, CreateCouponResponse } from '../types/coupon'

// 쿠폰 발급
export const issueCoupon = async (couponId: number): Promise<IssueCouponResponse> => {
  const response = await apiClient.post<IssueCouponResponse>(`/coupons/${couponId}/issue`)
  return response.data
}

// 쿠폰 생성 (관리자)
export const createCoupon = async (data: CreateCouponRequest): Promise<CreateCouponResponse> => {
  const response = await apiClient.post<CreateCouponResponse>('/admin/coupons', data)
  return response.data
}
