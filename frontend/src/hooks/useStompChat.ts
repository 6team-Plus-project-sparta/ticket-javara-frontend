/**
 * useStompChat — SockJS + STOMP WebSocket 채팅 훅
 *
 * 테스트 HTML 클라이언트와 동일한 방식:
 * - SockJS로 /ws-stomp 연결
 * - CONNECT 헤더에 Authorization: Bearer {token}
 * - 구독: /sub/chat/room/{chatRoomId}
 * - 발행: /pub/chat/message
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import type { ChatMessage } from '@/types/chat'

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

// SockJS 엔드포인트 — http:// 사용 (SockJS 규격)
const WS_ENDPOINT = (import.meta.env.VITE_WS_URL ?? 'http://localhost:8080/ws-stomp') as string

export function useStompChat({
  chatRoomId,
  onMessage,
  onError,
}: UseStompChatOptions): UseStompChatReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const clientRef     = useRef<Client | null>(null)
  const errorShownRef = useRef(false)

  useEffect(() => {
    if (!chatRoomId) return

    const token = localStorage.getItem('accessToken')
    setConnectionStatus('connecting')
    errorShownRef.current = false

    const client = new Client({
      // SockJS 팩토리 — index.html CDN으로 로드된 window.SockJS 사용
      webSocketFactory: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new (window as any).SockJS(WS_ENDPOINT)
      },

      // STOMP CONNECT 프레임 헤더에 JWT 포함
      connectHeaders: token
        ? { Authorization: `Bearer ${token}` }
        : {},

      // 자동 재연결 비활성화
      reconnectDelay: 0,

      onConnect: () => {
        setConnectionStatus('connected')
        errorShownRef.current = false

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
        if (!errorShownRef.current) {
          errorShownRef.current = true
          onError?.(frame.headers['message'] ?? 'STOMP 연결 오류가 발생했습니다.')
        }
      },

      onWebSocketError: () => {
        setConnectionStatus('error')
        if (!errorShownRef.current) {
          errorShownRef.current = true
          onError?.('WebSocket 연결에 실패했습니다.')
        }
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setConnectionStatus('disconnected')
    }
  }, [chatRoomId]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback((content: string) => {
    const client = clientRef.current
    if (!client?.connected || !chatRoomId) return
    client.publish({
      destination: '/pub/chat/message',
      body: JSON.stringify({ chatRoomId, content }),
    })
  }, [chatRoomId])

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate()
    clientRef.current = null
    setConnectionStatus('disconnected')
  }, [])

  return { connectionStatus, sendMessage, disconnect }
}
