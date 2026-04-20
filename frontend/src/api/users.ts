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
  const response = await apiClient.patch<ApiWrapper<{ message: string }>>('/users/me', data)
  return (response.data as ApiWrapper<{ message: string }>).data ?? response.data as unknown as { message: string }
}

// 내 예매 내역 조회
export const getMyBookings = async (params: BookingListParams): Promise<PageResponse<OrderSummary>> => {
  const response = await apiClient.get<ApiWrapper<PageResponse<OrderSummary>>>('/users/me/bookings', { params })
  console.log('[getMyBookings] raw:', response.data)
  const result = (response.data as ApiWrapper<PageResponse<OrderSummary>>).data ?? response.data as unknown as PageResponse<OrderSummary>
  console.log('[getMyBookings] unwrapped:', result)

  // { content, page: { totalPages, ... } } 구조 대응
  const data = result as PageResponse<OrderSummary> & { page?: { totalPages?: number; totalElements?: number; size?: number; number?: number } }
  if (data.page && data.totalPages === undefined) {
    data.totalPages    = data.page.totalPages ?? 0
    data.totalElements = data.page.totalElements ?? 0
    data.size          = data.page.size ?? 5
  }

  return data
}

// 내 쿠폰 목록 조회
export const getMyCoupons = async (): Promise<UserCoupon[]> => {
  const response = await apiClient.get<ApiWrapper<UserCoupon[]>>('/users/me/coupons')
  return (response.data as ApiWrapper<UserCoupon[]>).data ?? response.data as unknown as UserCoupon[]
}
