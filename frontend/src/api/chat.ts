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

/** 백엔드 공통 응답 래퍼 */
interface ApiWrapper<T> {
  data: T
  code: string
  message: string
}

/** 래퍼 구조면 data.data, 아니면 data 직접 반환 */
function unwrap<T>(response: { data: ApiWrapper<T> | T }): T {
  const d = response.data as ApiWrapper<T>
  return d?.data !== undefined ? d.data : (response.data as T)
}

// 채팅방 생성 (없으면 생성, 있으면 기존 방 반환)
export const createChatRoom = async (): Promise<ChatRoom> => {
  const response = await apiClient.post<ApiWrapper<ChatRoom>>('/chat/rooms')
  console.log('[createChatRoom] raw response.data:', response.data)
  const result = unwrap(response)
  console.log('[createChatRoom] unwrapped:', result)
  return result
}

// 채팅 메시지 목록 조회
export const getChatMessages = async (
  chatRoomId: number,
  params: ChatMessageParams
): Promise<ChatMessageListResponse> => {
  const response = await apiClient.get<ApiWrapper<ChatMessageListResponse>>(
    `/chat/rooms/${chatRoomId}/messages`,
    { params }
  )
  return unwrap(response)
}

// 채팅방 종료
export const closeChatRoom = async (
  chatRoomId: number
): Promise<{ message: string; chatRoomId: number; chatRoom: ChatRoom; closedAt: string }> => {
  const response = await apiClient.patch<ApiWrapper<{ message: string; chatRoomId: number; chatRoom: ChatRoom; closedAt: string }>>(
    `/chat/rooms/${chatRoomId}/close`
  )
  return unwrap(response)
}

// 채팅방 목록 조회 (관리자)
export const getAdminChatRooms = async (
  params: AdminChatRoomParams
): Promise<PageResponse<AdminChatRoom>> => {
  const response = await apiClient.get<ApiWrapper<PageResponse<AdminChatRoom>>>('/admin/chat/rooms', { params })
  return unwrap(response)
}

// 채팅방 상태 변경 (관리자)
export const updateChatRoomStatus = async (
  chatRoomId: number,
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED',
): Promise<ChatRoom> => {
  const response = await apiClient.patch<ApiWrapper<ChatRoom>>(
    `/admin/chat/rooms/${chatRoomId}/status`,
    { status }
  )
  return unwrap(response)
}

// 예매 확정 (관리자)
export const confirmBooking = async (bookingId: number): Promise<ConfirmBookingResponse> => {
  const response = await apiClient.patch<ApiWrapper<ConfirmBookingResponse>>(`/admin/bookings/${bookingId}/confirm`)
  return unwrap(response)
}
