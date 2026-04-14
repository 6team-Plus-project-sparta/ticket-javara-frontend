// 채팅 관련 타입 정의 - 채팅방, 메시지, 관리자 채팅, 예매 확정
import { PageResponse } from './common'

export interface ChatRoom {
  chatRoomId: number
  status: 'OPEN' | 'CLOSED'
  createdAt: string
  isNew: boolean
}

export interface ChatMessage {
  chatMessageId: number
  senderId: number
  senderRole: 'USER' | 'ADMIN'
  senderNickname: string
  content: string
  sentAt: string
}

export interface ChatMessageParams {
  cursor?: number
  size?: number
}

export interface ChatMessageListResponse {
  chatRoomId: number
  messages: ChatMessage[]
  nextCursor: number | null
  hasNext: boolean
}

export interface AdminChatRoom {
  chatRoomId: number
  userId: number
  userNickname: string
  status: 'OPEN' | 'CLOSED'
  lastMessage: string
  createdAt: string
}

export interface AdminChatRoomParams {
  status?: 'OPEN' | 'CLOSED'
  page?: number
  size?: number
}

export interface ConfirmBookingResponse {
  message: string
  bookingId: number
  orderId: number
  status: string
  ticketCode: string
  confirmedAt: string
}

// PageResponse를 re-export (다른 파일에서 chat 타입과 함께 사용 시 편의를 위해)
export type { PageResponse }
