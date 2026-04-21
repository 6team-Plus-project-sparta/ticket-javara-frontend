// 사용자 관련 타입 정의 - 프로필, 예매 내역, 쿠폰
import { PageResponse } from './common'

export interface UserProfile {
  userId: number
  email: string
  nickname: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface UpdateMeRequest {
  nickname?: string
  currentPassword: string
  password?: string
}

export interface BookingListParams {
  page?: number
  size?: number
  status?: 'CONFIRMED' | 'CANCELLED' | 'PENDING'
}

export interface OrderSummaryItem {
  seatNumber: string
  sectionName: string
  originalPrice: number
}

export interface OrderSummary {
  orderId: number
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING'
  totalAmount: number
  discountAmount: number
  finalAmount: number
  createdAt: string
  /** 백엔드 응답에 포함될 경우 선택적 필드 */
  eventTitle?: string
  eventDate?: string
  venueName?: string
  items?: OrderSummaryItem[]
}

export interface UserCoupon {
  userCouponId: number
  couponId: number
  couponName: string
  discountAmount: number
  expiredAt: string
  status: 'ISSUED' | 'USED' | 'EXPIRED'
  issuedAt: string
}

// PageResponse를 re-export (다른 파일에서 user 타입과 함께 사용 시 편의를 위해)
export type { PageResponse }
