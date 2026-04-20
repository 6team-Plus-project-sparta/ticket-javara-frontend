// 좌석 관련 API - 좌석 조회, 선점, 선점 해제
import apiClient from './client'
import type { SeatMap, HoldResponse } from '../types/seat'

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

// 좌석 목록 조회 (섹션 필터 선택)
export const getSeats = async (eventId: number, sectionId?: number): Promise<SeatMap> => {
  const response = await apiClient.get<ApiWrapper<SeatMap>>(`/events/${eventId}/seats`, {
    params: sectionId !== undefined ? { sectionId } : undefined,
  })
  console.log('[getSeats] raw:', response.data)
  const result = unwrap(response.data)
  console.log('[getSeats] unwrapped:', result)
  return result
}

// 좌석 선점
export const holdSeat = async (eventId: number, seatId: number): Promise<HoldResponse> => {
  const response = await apiClient.post<ApiWrapper<HoldResponse>>(`/events/${eventId}/seats/${seatId}/hold`)
  return unwrap(response.data)
}

// 좌석 선점 해제
export const releaseHold = async (
  eventId: number,
  seatId: number
): Promise<{ message: string; seatId: number }> => {
  const response = await apiClient.delete<ApiWrapper<{ message: string; seatId: number }>>(
    `/events/${eventId}/seats/${seatId}/hold`
  )
  return unwrap(response.data)
}
