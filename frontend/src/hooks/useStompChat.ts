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
  const clientRef   = useRef<Client | null>(null)
  // 에러 토스트를 한 번만 띄우기 위한 플래그
  const errorShownRef = useRef(false)

  useEffect(() => {
    if (!chatRoomId) return

    const token = localStorage.getItem('accessToken')
    setConnectionStatus('connecting')
    errorShownRef.current = false

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      // 자동 재연결 비활성화 — 새로고침 시에만 재시도
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
        // 에러 토스트는 최초 1회만
        if (!errorShownRef.current) {
          errorShownRef.current = true
          onError?.(frame.headers['message'] ?? 'STOMP 연결 오류가 발생했습니다.')
        }
      },

      onWebSocketError: () => {
        setConnectionStatus('error')
        // 에러 토스트는 최초 1회만
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
