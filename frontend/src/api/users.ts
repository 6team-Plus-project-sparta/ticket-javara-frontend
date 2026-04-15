// 사용자 관련 API - 내 정보 조회/수정, 예매 내역, 쿠폰 조회
import apiClient from './client'
import type { UserProfile, UpdateMeRequest, BookingListParams, OrderSummary, UserCoupon } from '../types/user'
import type { PageResponse } from '../types/common'

/** 백엔드 공통 응답 래퍼 */
interface ApiWrapper<T> {
  data: T
  code: string
  message: string
}

// 내 프로필 조회
export const getMe = async (): Promise<UserProfile> => {
  const response = await apiClient.get<ApiWrapper<UserProfile>>('/users/me')
  // 래퍼 구조면 data.data, 아니면 data 직접 사용
  return (response.data as ApiWrapper<UserProfile>).data ?? response.data as unknown as UserProfile
}

// 내 프로필 수정
export const updateMe = async (data: UpdateMeRequest): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>('/users/me', data)
  return response.data
}

// 내 예매 내역 조회
export const getMyBookings = async (params: BookingListParams): Promise<PageResponse<OrderSummary>> => {
  const response = await apiClient.get<PageResponse<OrderSummary>>('/users/me/bookings', { params })
  return response.data
}

// 내 쿠폰 목록 조회
export const getMyCoupons = async (): Promise<UserCoupon[]> => {
  const response = await apiClient.get<UserCoupon[]>('/users/me/coupons')
  return response.data
}
