// 채팅 관련 API - 채팅방 생성/조회/종료, 메시지 조회, 예매 확정 (관리자)
import apiClient from './client'
import type {
  ChatRoom,
  ChatMessageParams,
  ChatMessageListResponse,
  AdminChatRoomParams,
  AdminChatRoom,
  ConfirmBookingResponse,
} from '../types/chat'
import type { PageResponse } from '../types/common'

// 채팅방 생성
export const createChatRoom = async (): Promise<ChatRoom> => {
  const response = await apiClient.post<ChatRoom>('/chat/rooms')
  return response.data
}

// 채팅 메시지 목록 조회
export const getChatMessages = async (
  chatRoomId: number,
  params: ChatMessageParams
): Promise<ChatMessageListResponse> => {
  const response = await apiClient.get<ChatMessageListResponse>(`/chat/rooms/${chatRoomId}/messages`, {
    params,
  })
  return response.data
}

// 채팅방 종료
export const closeChatRoom = async (
  chatRoomId: number
): Promise<{ message: string; chatRoomId: number; closedAt: string }> => {
  const response = await apiClient.patch<{ message: string; chatRoomId: number; closedAt: string }>(
    `/chat/rooms/${chatRoomId}/close`
  )
  return response.data
}

// 채팅방 목록 조회 (관리자)
export const getAdminChatRooms = async (
  params: AdminChatRoomParams
): Promise<PageResponse<AdminChatRoom>> => {
  const response = await apiClient.get<PageResponse<AdminChatRoom>>('/admin/chat/rooms', { params })
  return response.data
}

// 예매 확정 (관리자)
export const confirmBooking = async (bookingId: number): Promise<ConfirmBookingResponse> => {
  const response = await apiClient.patch<ConfirmBookingResponse>(`/admin/bookings/${bookingId}/confirm`)
  return response.data
}
