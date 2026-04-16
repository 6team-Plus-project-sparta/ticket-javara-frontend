/**
 * ChatRouterPage — 역할에 따라 채팅 페이지를 분기
 * - ADMIN → AdminChatPage (채팅방 목록 + 관리)
 * - USER  → ChatPage (1:1 CS 채팅)
 */

import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components'
import ChatPage from './ChatPage'
import AdminChatPage from './AdminChatPage'

function ChatRouterPage() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) return <LoadingSpinner fullScreen />

  if (user?.role === 'ADMIN') return <AdminChatPage />

  return <ChatPage />
}

export default ChatRouterPage
