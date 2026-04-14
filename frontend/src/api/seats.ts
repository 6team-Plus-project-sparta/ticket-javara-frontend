// 좌석 관련 API - 좌석 조회, 선점, 선점 해제
import apiClient from './client'
import type { SeatMap, HoldResponse } from '../types/seat'

// 좌석 목록 조회 (섹션 필터 선택)
export const getSeats = async (eventId: number, sectionId?: number): Promise<SeatMap> => {
  const response = await apiClient.get<SeatMap>(`/events/${eventId}/seats`, {
    params: sectionId !== undefined ? { sectionId } : undefined,
  })
  return response.data
}

// 좌석 선점
export const holdSeat = async (eventId: number, seatId: number): Promise<HoldResponse> => {
  const response = await apiClient.post<HoldResponse>(`/events/${eventId}/seats/${seatId}/hold`)
  return response.data
}

// 좌석 선점 해제
export const releaseHold = async (
  eventId: number,
  seatId: number
): Promise<{ message: string; seatId: number }> => {
  const response = await apiClient.delete<{ message: string; seatId: number }>(
    `/events/${eventId}/seats/${seatId}/hold`
  )
  return response.data
}
