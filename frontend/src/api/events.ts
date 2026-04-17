// 이벤트 관련 API - 목록 조회, 상세 조회, 검색, 생성
import apiClient from './client'
import type {
  EventListParams,
  EventSearchParams,
  EventSummary,
  EventDetail,
  CreateEventRequest,
  CreateEventResponse,
} from '../types/event'
import type { PageResponse } from '../types/common'

/** 백엔드 공통 응답 래퍼 */
interface ApiWrapper<T> {
  data: T
  code: string
  message: string
}

/** 래퍼 구조면 data.data, 아니면 data 직접 반환 */
function unwrap<T>(data: ApiWrapper<T> | T): T {
  const d = data as ApiWrapper<T>
  return d?.data !== undefined ? d.data : (data as T)
}

// 이벤트 목록 조회
export const getEvents = async (params: EventListParams): Promise<PageResponse<EventSummary>> => {
  const response = await apiClient.get<ApiWrapper<PageResponse<EventSummary>>>('/events', { params })
<<<<<<< HEAD
  console.log('[getEvents] raw:', response.data)
  const result = unwrap(response.data)
  console.log('[getEvents] unwrapped:', result)

  // 백엔드가 { content, page: { totalPages, ... } } 구조로 내려주는 경우 대응
  const data = result as PageResponse<EventSummary> & { page?: { totalPages?: number; totalElements?: number; size?: number; number?: number } }
  if (data.page && data.totalPages === undefined) {
    data.totalPages    = data.page.totalPages ?? 0
    data.totalElements = data.page.totalElements ?? 0
    data.size          = data.page.size ?? 9
    data.page_number   = data.page.number ?? 0
  }

  return data
=======
  return unwrap(response.data)
>>>>>>> dev
}

// 이벤트 상세 조회
export const getEventDetail = async (eventId: number): Promise<EventDetail> => {
  const response = await apiClient.get<ApiWrapper<EventDetail>>(`/events/${eventId}`)
  console.log('[getEventDetail] raw:', response.data)
  const result = unwrap(response.data)
  console.log('[getEventDetail] unwrapped:', result)
  return result
}

// 이벤트 검색 v1 (캐시 없음 — 성능 기준선)
export const searchEventsV1 = async (params: EventSearchParams): Promise<PageResponse<EventSummary>> => {
  const response = await apiClient.get<ApiWrapper<PageResponse<EventSummary>>>('/v1/events/search', { params })
  return unwrap(response.data)
}

/** v2 검색 응답 — 데이터 + X-Cache 헤더 값 포함 */
export interface SearchV2Result {
  data: PageResponse<EventSummary>
  cacheStatus: 'HIT' | 'MISS' | null
}

// 이벤트 검색 v2 (Caffeine → Redis Cache-Aside, X-Cache 헤더 포함)
export const searchEventsV2 = async (params: EventSearchParams): Promise<SearchV2Result> => {
  const response = await apiClient.get<ApiWrapper<PageResponse<EventSummary>>>('/v2/events/search', { params })
  const cacheHeader = response.headers['x-cache'] as string | undefined
  const cacheStatus = cacheHeader === 'HIT' ? 'HIT' : cacheHeader === 'MISS' ? 'MISS' : null
  return { data: unwrap(response.data), cacheStatus }
}

// 이벤트 생성 (관리자)
export const createEvent = async (data: CreateEventRequest): Promise<CreateEventResponse> => {
  const response = await apiClient.post<ApiWrapper<CreateEventResponse>>('/admin/events', data)
  return unwrap(response.data)
}
