/**
 * useStompChat — STOMP WebSocket 채팅 훅
 *
 * 역할:
 * - WebSocket 연결 / 해제 관리
 * - 채팅방 구독 (/sub/chat/room/{chatRoomId})
 * - 메시지 발행 (/pub/chat/message)
 * - 연결 상태 노출 (connecting / connected / disconnected / error)
 *
 * 사용 예시:
 *   const { connectionStatus, sendMessage, disconnect } = useStompChat({
 *     chatRoomId,
 *     token,
 *     onMessage: (msg) => setMessages(prev => [...prev, msg]),
 *   })
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import type { ChatMessage } from '@/types/chat'
import { getToken } from '@/utils/storage'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseStompChatOptions {
  chatRoomId: number | null
  onMessage: (message: ChatMessage) => void
  onError?: (error: string) => void
}

interface UseStompChatReturn {
  connectionStatus: ConnectionStatus
  sendMessage: (content: string) => void
  disconnect: () => void
}

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws-stomp'

export function useStompChat({
  chatRoomId,
  onMessage,
  onError,
}: UseStompChatOptions): UseStompChatReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!chatRoomId) return

    const token = getToken()
    setConnectionStatus('connecting')

    const client = new Client({
      brokerURL: WS_URL,
      // STOMP CONNECT 프레임에 JWT 포함
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      // 재연결 간격 (5초)
      reconnectDelay: 5000,

      onConnect: () => {
        setConnectionStatus('connected')
        // 채팅방 구독
        client.subscribe(`/sub/chat/room/${chatRoomId}`, (frame) => {
          try {
            const msg = JSON.parse(frame.body) as ChatMessage
            onMessage(msg)
          } catch {
            // 파싱 실패 무시
          }
        })
      },

      onDisconnect: () => {
        setConnectionStatus('disconnected')
      },

      onStompError: (frame) => {
        setConnectionStatus('error')
        onError?.(frame.headers['message'] ?? 'STOMP 연결 오류가 발생했습니다.')
      },

      onWebSocketError: () => {
        setConnectionStatus('error')
        onError?.('WebSocket 연결에 실패했습니다.')
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setConnectionStatus('disconnected')
    }
  }, [chatRoomId]) // chatRoomId 바뀌면 재연결

  // 메시지 발행
  const sendMessage = useCallback((content: string) => {
    const client = clientRef.current
    if (!client?.connected || !chatRoomId) return
    client.publish({
      destination: '/pub/chat/message',
      body: JSON.stringify({ chatRoomId, content }),
    })
  }, [chatRoomId])

  // 수동 연결 해제
  const disconnect = useCallback(() => {
    clientRef.current?.deactivate()
    clientRef.current = null
    setConnectionStatus('disconnected')
  }, [])

  return { connectionStatus, sendMessage, disconnect }
}
