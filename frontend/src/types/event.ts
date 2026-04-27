// 이벤트 관련 타입 정의 - 목록, 상세, 검색, 생성

export type EventCategory = 'CONCERT' | 'MUSICAL' | 'DISPLAY' | 'SPORTS' | 'ETC'

export type EventStatus = 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED' | 'ENDED' | 'DELETED'

export interface EventListParams {
  page?: number
  size?: number
  sort?: string
  category?: EventCategory
  status?: EventStatus
}

export interface EventSearchParams {
  keyword?: string
  category?: EventCategory
  startDate?: string
  endDate?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  size?: number
  sort?: string
}

export interface EventSummary {
  eventId: number
  title: string
  category: EventCategory
  venueName: string
  eventDate: string
  minPrice: number
  remainingSeats: number
  thumbnailUrl: string
  eventStatus?: EventStatus   // 백엔드 응답 필드명과 일치
}

export interface Venue {
  venueId: number
  name: string
  address: string
}

export interface EventSection {
  sectionId: number
  sectionName: string
  price: number
  totalSeats: number
  remainingSeats: number
}

export interface EventDetail {
  eventId: number
  title: string
  category: EventCategory
  venue: Venue
  eventDate: string
  /** 예매 오픈 시각 */
  saleStartAt?: string
  /** 예매 마감 시각 */
  saleEndAt?: string
  /** 회차 번호 */
  roundNumber?: number
  description: string
  thumbnailUrl: string
  sections: EventSection[]
}

export interface CreateEventSectionInput {
  sectionName: string
  price: number
  rowCount: number
  colCount: number
}

export interface CreateEventRequest {
  title: string
  category: EventCategory
  venueId: number
  eventDate: string
  saleStartAt: string
  saleEndAt: string
  roundNumber?: number
  description?: string
  thumbnailUrl?: string
  sections: CreateEventSectionInput[]
}

export interface CreateEventResponse {
  eventId: number
  title: string
  totalSeats: number
  sectionsCreated: number
}

/** PATCH /api/admin/events/{eventId}/status 요청 */
export interface EventStatusUpdateRequest {
  status: EventStatus
}

/** PATCH /api/admin/events/{eventId}/status 응답 */
export interface EventStatusUpdateResponse {
  eventId: number
  status: EventStatus
}

/** 상태별 허용 전환 맵 (백엔드 Event.java와 동일) */
export const ALLOWED_STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  ON_SALE:   ['SOLD_OUT', 'CANCELLED', 'DELETED'],
  SOLD_OUT:  ['ON_SALE', 'CANCELLED', 'DELETED'],
  CANCELLED: ['DELETED'],
  ENDED:     ['DELETED'],
  DELETED:   [],
}
