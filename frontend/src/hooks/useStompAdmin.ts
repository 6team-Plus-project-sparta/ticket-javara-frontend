import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { getToken } from '@/utils/storage'
import { AdminChatRoom } from '@/types/chat'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:8080/ws-stomp'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * 관리자 전용 — 신규 문의 알림 수신
 * SUBSCRIBE /sub/chat/rooms 
 */
export function useStompAdmin(onNewRoom: (roomInfo: AdminChatRoom) => void) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    const token = getToken()
    setConnectionStatus('connecting')

    const client = new Client({
      webSocketFactory: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new (window as any).SockJS(WS_URL)
      },
      // brokerURL 제거
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setConnectionStatus('connected')
        client.subscribe('/sub/chat/rooms', (frame) => {
          try {
            const msg = JSON.parse(frame.body) as AdminChatRoom
            onNewRoom(msg)
          } catch {
            // 파싱 실패
          }
        })
      },
      onDisconnect: () => setConnectionStatus('disconnected'),
      onStompError: () => setConnectionStatus('error'),
      onWebSocketError: () => setConnectionStatus('error')
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [onNewRoom])

  return { connectionStatus }
}
