// 이벤트 관련 타입 정의 - 목록, 상세, 검색, 생성

export type EventCategory = 'CONCERT' | 'MUSICAL' | 'SPORTS' | 'EXHIBITION' | 'ETC'

export interface EventListParams {
  page?: number
  size?: number
  sort?: string
  category?: EventCategory
  /** 상태 필터: ON_SALE | SOLD_OUT | CANCELLED | ENDED */
  status?: 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED' | 'ENDED'
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
  /** 백엔드가 내려주는 이벤트 상태 */
  status?: 'ON_SALE' | 'SOLD_OUT' | 'ENDED' | 'CANCELLED'
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
  /** 이벤트 상태 (백엔드가 내려주는 경우) */
  status?: 'ON_SALE' | 'SOLD_OUT' | 'ENDED' | 'CANCELLED'
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
