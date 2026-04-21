/**
 * useStompChat — SockJS + STOMP WebSocket 채팅 훅
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

const WS_ENDPOINT = (import.meta.env.VITE_WS_URL ?? 'http://localhost:8080/ws-stomp') as string

export function useStompChat({
  chatRoomId,
  onMessage,
  onError,
}: UseStompChatOptions): UseStompChatReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const clientRef = useRef<Client | null>(null)
  const errorShownRef = useRef(false)
  const reconnectCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isReconnectingRef = useRef(false) // 재연결 중복 방지
  const maxReconnectAttempts = 3

  // 수동 재연결 함수
  const attemptReconnect = useCallback(() => {
    // 이미 재연결 중이면 무시
    if (isReconnectingRef.current) {
      console.log('[useStompChat] 이미 재연결 중이므로 무시')
      return
    }

    if (reconnectCountRef.current >= maxReconnectAttempts) {
      console.log('[useStompChat] 재연결 3회 실패, 재연결 중단')
      setConnectionStatus('error')
      if (!errorShownRef.current) {
        errorShownRef.current = true
        onError?.('연결에 계속 실패합니다. 페이지를 새로고침해주세요.')
      }
      return
    }

    isReconnectingRef.current = true // 재연결 시작
    reconnectCountRef.current++
    console.log('[useStompChat] 재연결 시도:', reconnectCountRef.current, '/ 3회')
    setConnectionStatus('connecting')
    
    reconnectTimeoutRef.current = setTimeout(() => {
      const client = clientRef.current
      if (client) {
        console.log('[useStompChat] 실제 재연결 실행')
        // 기존 클라이언트 정리 후 새로 연결
        client.deactivate()
        setTimeout(() => {
          client.activate()
          isReconnectingRef.current = false // 재연결 완료
        }, 100)
      } else {
        isReconnectingRef.current = false // 클라이언트가 없으면 재연결 완료 처리
      }
    }, 3000)
  }, [onError])

  useEffect(() => {
    if (!chatRoomId) {
      // chatRoomId가 없으면 연결하지 않음
      setConnectionStatus('disconnected')
      // 기존 재연결 타이머 취소
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      isReconnectingRef.current = false
      return
    }

    const token = localStorage.getItem('accessToken')
    setConnectionStatus('connecting')
    errorShownRef.current = false
    reconnectCountRef.current = 0
    isReconnectingRef.current = false
    console.log('[useStompChat] 연결 시도 chatRoomId:', chatRoomId, 'endpoint:', WS_ENDPOINT)

    const client = new Client({
      webSocketFactory: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new (window as any).SockJS(WS_ENDPOINT)
      },
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 0, // 자동 재연결 비활성화

      onConnect: () => {
        setConnectionStatus('connected')
        errorShownRef.current = false
        reconnectCountRef.current = 0 // 연결 성공 시 카운터 리셋
        isReconnectingRef.current = false // 재연결 완료
        
        // 기존 재연결 타이머 취소
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        
        console.log('[useStompChat] 연결 성공, 구독:', `/sub/chat/room/${chatRoomId}`)
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
        console.log('[useStompChat] 연결 끊어짐')
        setConnectionStatus('disconnected')
        // onWebSocketClose에서 처리하므로 여기서는 재연결하지 않음
      },

      onStompError: (frame) => {
        console.error('[useStompChat] STOMP 에러:', frame)
        setConnectionStatus('error')
        
        if (!errorShownRef.current) {
          errorShownRef.current = true
          onError?.(frame.headers['message'] ?? 'STOMP 연결 오류가 발생했습니다.')
        }
        
        // 수동 재연결 시도
        attemptReconnect()
      },

      onWebSocketError: (event) => {
        console.error('[useStompChat] WebSocket 에러:', event)
        setConnectionStatus('error')
        
        if (!errorShownRef.current) {
          errorShownRef.current = true
          onError?.('WebSocket 연결에 실패했습니다.')
        }
        
        // 수동 재연결 시도
        attemptReconnect()
      },

      // 연결 상태 변화 감지 추가
      onWebSocketClose: (event) => {
        console.log('[useStompChat] WebSocket 닫힘:', event.code, event.reason)
        // 비정상 종료(1000이 아닌 경우)만 재연결 시도
        if (event.code !== 1000) {
          console.log('[useStompChat] 비정상 연결 종료 - 재연결 시도')
          setConnectionStatus('disconnected')
          attemptReconnect()
        } else {
          console.log('[useStompChat] 정상 연결 종료 - 재연결하지 않음')
        }
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      // 정리 시 타이머 취소
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      client.deactivate()
      clientRef.current = null
      setConnectionStatus('disconnected')
      isReconnectingRef.current = false
    }
  }, [chatRoomId]) // attemptReconnect 의존성 제거

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
