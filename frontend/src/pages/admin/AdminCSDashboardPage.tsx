import { useCallback, useEffect, useRef, useState } from 'react'
import { getAdminChatRooms, getChatMessages, closeChatRoom } from '@/api/chat'
import type { AdminChatRoom, ChatMessage } from '@/types/chat'
import { Button, LoadingSpinner, Modal } from '@/components'
import { useToast } from '@/components/Toast'
import { useStompChat, type ConnectionStatus } from '@/hooks/useStompChat'
import { useStompAdmin } from '@/hooks/useStompAdmin'
import { useAuth } from '@/contexts/AuthContext'

const MESSAGE_PAGE_SIZE = 30

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

const getDateLabel = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    connecting:   { dot: 'bg-yellow-400 animate-pulse', text: '연결 중...',  textColor: 'text-yellow-600' },
    connected:    { dot: 'bg-green-500',                text: '연결됨',      textColor: 'text-green-600' },
    disconnected: { dot: 'bg-gray-400',                 text: '연결 끊김',   textColor: 'text-gray-500' },
    error:        { dot: 'bg-red-500',                  text: '연결 오류',   textColor: 'text-red-500' },
  }[status]

  return (
    <div className="flex items-center gap-1.5">
      <span className={['h-2 w-2 rounded-full', config.dot].join(' ')} />
      <span className={['text-xs font-medium', config.textColor].join(' ')}>{config.text}</span>
    </div>
  )
}

export default function AdminCSDashboardPage() {
  const { toast } = useToast()
  const { user } = useAuth()

  // 좌측 문의 목록 State
  const [rooms, setRooms] = useState<AdminChatRoom[]>([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)

  // 우측 채팅 (선택된 채티방) State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const prevScrollHeight = useRef(0)

  // 글로벌 웹소켓 (신규 문의 알림)
  const onNewRoom = useCallback((newRoom: AdminChatRoom) => {
    setRooms((prev: AdminChatRoom[]) => {
      // 기존에 있으면 갱신, 없으면 앞에 추가
      const exists = prev.some((r: AdminChatRoom) => r.chatRoomId === newRoom.chatRoomId)
      if (exists) return prev.map((r: AdminChatRoom) => r.chatRoomId === newRoom.chatRoomId ? newRoom : r)
      return [newRoom, ...prev]
    })
    toast.info(`[신규 문의] ${newRoom.userNickname} 님의 문의가 들어왔습니다.`)
  }, [toast])
  
  const { connectionStatus: adminConnectionStatus } = useStompAdmin(onNewRoom)

  // 선택방 관련 웹소켓 통신
  const { connectionStatus: roomConnectionStatus, sendMessage: stompSend } = useStompChat({
    chatRoomId: selectedRoomId,
    onMessage: (msg: ChatMessage) => {
      setMessages((prev: ChatMessage[]) => [...prev, msg])
      scrollToBottom()
      // 좌측 목록 갱신 (마지막 메시지 표시용 등)
      setRooms((prev: AdminChatRoom[]) => prev.map((r: AdminChatRoom) => 
        r.chatRoomId === selectedRoomId ? { ...r, lastMessage: msg.content } : r
      ))
    },
    onError: (err) => toast.error(err),
  })

  // 초기 문의 목록 로드
  useEffect(() => {
    setRoomsLoading(true)
    getAdminChatRooms({ size: 50 })
      .then(res => setRooms(res.content))
      .catch(() => toast.error('문의 목록을 불러오지 못했습니다.'))
      .finally(() => setRoomsLoading(false))
  }, [toast])

  // 선택된 방 변경 시 메시지 조회
  useEffect(() => {
    if (!selectedRoomId) return
    setHistoryLoading(true)
    getChatMessages(selectedRoomId, { size: MESSAGE_PAGE_SIZE })
      .then(res => {
        setMessages([...res.messages].reverse())
        setNextCursor(res.nextCursor)
        setHasNext(res.hasNext)
      })
      .catch(() => toast.error('채팅 내역을 불러오지 못했습니다.'))
      .finally(() => setHistoryLoading(false))
  }, [selectedRoomId, toast])

  // 추가 메시지 로드
  const loadMoreMessages = useCallback(async () => {
    if (!selectedRoomId || !hasNext || historyLoading || nextCursor === null) return
    setHistoryLoading(true)
    prevScrollHeight.current = listRef.current?.scrollHeight ?? 0
    try {
      const res = await getChatMessages(selectedRoomId, { cursor: nextCursor, size: MESSAGE_PAGE_SIZE })
      setMessages((prev: ChatMessage[]) => [...[...res.messages].reverse(), ...prev])
      setNextCursor(res.nextCursor)
      setHasNext(res.hasNext)
    } catch {
      toast.error('이전 메시지를 불러오지 못했습니다.')
    } finally {
      setHistoryLoading(false)
    }
  }, [selectedRoomId, hasNext, historyLoading, nextCursor, toast])

  // 스크롤 초기화 및 유지
  useEffect(() => {
    if (!historyLoading && prevScrollHeight.current > 0 && listRef.current) {
      const diff = listRef.current.scrollHeight - prevScrollHeight.current
      listRef.current.scrollTop = diff
      prevScrollHeight.current = 0
    }
  }, [messages, historyLoading])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])
  
  useEffect(() => {
    if (messages.length > 0 && !historyLoading) {
      scrollToBottom()
    }
  }, [selectedRoomId])

  const handleScroll = useCallback(() => {
    if (!listRef.current) return
    if (listRef.current.scrollTop === 0 && hasNext) {
      loadMoreMessages()
    }
  }, [hasNext, loadMoreMessages])

  const handleSend = () => {
    const content = inputText.trim()
    if (!content || !selectedRoomId) return
    setSending(true)
    try {
      stompSend(content)
      setInputText('')
    } finally {
      setSending(false)
    }
  }

  const handleCloseRoom = async () => {
    if (!selectedRoomId) return
    setClosing(true)
    try {
      await closeChatRoom(selectedRoomId)
      toast.success('문의가 종료되었습니다.')
      setRooms((prev: AdminChatRoom[]) => prev.map((r: AdminChatRoom) => r.chatRoomId === selectedRoomId ? { ...r, status: 'CLOSED' } : r))
    } catch {
      toast.error('채팅방 종료 중 오류가 발생했습니다.')
    } finally {
      setClosing(false)
    }
  }

  // 필터링 적용된 목록
  const filteredRooms = rooms.filter((r: AdminChatRoom) => activeTab === 'ALL' || r.status === activeTab)
  const selectedRoom = rooms.find((r: AdminChatRoom) => r.chatRoomId === selectedRoomId)
  const isClosed = selectedRoom?.status === 'CLOSED'
  const canSend = roomConnectionStatus === 'connected' && !isClosed && inputText.trim().length > 0
  
  return (
    <div className="flex h-[calc(100vh-8rem)] w-full rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      
      {/* 왼쪽: 문의 목록 창 */}
      <div className="w-1/3 flex flex-col border-r border-gray-100 bg-gray-50/50">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex gap-2 items-center">
            <h2 className="font-bold text-gray-800 tracking-tight">문의 목록</h2>
            <span className="bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full text-xs">{filteredRooms.length}</span>
          </div>
          <ConnectionBadge status={adminConnectionStatus} />
        </div>
        
        {/* 탭 */}
        <div className="flex px-4 py-2 border-b border-gray-100 gap-2 shrink-0 bg-white">
          {(['ALL', 'OPEN', 'CLOSED'] as const).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={['text-xs px-3 py-1.5 rounded-full font-semibold transition-colors', activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'].join(' ')}
            >
              {tab === 'ALL' ? '전체' : tab === 'OPEN' ? '진행중' : '종료'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {roomsLoading ? (
             <div className="h-full flex items-center justify-center"><LoadingSpinner size="small" /></div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-10">문의 내역이 없습니다.</div>
          ) : (
            filteredRooms.map((r: AdminChatRoom) => {
              const isSelected = r.chatRoomId === selectedRoomId
              const isNew = r.status === 'OPEN' // 임의로 OPEN일 때 테두리 색 다르게 강조

              return (
                <button
                  key={r.chatRoomId}
                  onClick={() => setSelectedRoomId(r.chatRoomId)}
                  className={[
                    'w-full text-left p-3 rounded-xl border transition-all duration-200 focus:outline-none flex flex-col gap-1',
                    isSelected ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-gray-100 shadow-sm hover:border-gray-200 hover:shadow',
                    r.status === 'OPEN' && !isSelected && 'border-l-4 border-l-orange-400'
                  ].join(' ')}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5 text-sm">
                      <span className={r.status === 'OPEN' ? 'text-green-500' : 'text-gray-400'}>●</span>
                      {r.userNickname}
                    </span>
                    <span className="text-xs text-gray-400">{formatTime(r.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs text-gray-500 truncate w-4/5">{r.lastMessage || '새로운 문의가 접수되었습니다.'}</span>
                    <span className={['text-[10px] font-bold px-1.5 py-0.5 rounded', r.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'].join(' ')}>
                      {r.status}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 오른쪽: 채팅 뷰어 */}
      <div className="w-2/3 flex flex-col bg-slate-50 relative">
        {selectedRoomId ? (
          <>
            <div className="px-6 py-4 border-b border-gray-100 bg-white shrink-0 flex items-center justify-between shadow-sm z-10">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{selectedRoom?.userNickname} 님의 문의</h3>
                  <span className="text-xs text-gray-400 font-mono">#{selectedRoomId}</span>
                </div>
                {roomConnectionStatus !== 'connected' && <span className="text-xs text-orange-500 font-medium">연결 시도 중...</span>}
              </div>
              <Button size="small" variant="secondary" onClick={handleCloseRoom} disabled={isClosed || closing}>
                {isClosed ? '종료됨' : '문의 종료 ✕'}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={listRef} onScroll={handleScroll}>
              {historyLoading && <div className="text-center py-2"><LoadingSpinner size="small"/></div>}
              
              {!hasNext && messages.length > 0 && <p className="text-center text-xs text-gray-300 py-2">대화 시작</p>}

              {messages.length === 0 && !historyLoading && (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">대화 내역이 없습니다.</div>
              )}

              {messages.map((msg: ChatMessage, idx: number) => {
                const dateLabel = getDateLabel(msg.sentAt)
                const showDivider = idx === 0 || getDateLabel(messages[idx-1].sentAt) !== dateLabel
                const isAdmin = msg.senderRole === 'ADMIN'

                return (
                  <div key={msg.chatMessageId}>
                    {showDivider && (
                      <div className="flex items-center gap-3 py-4">
                        <div className="flex-1 border-t border-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">{dateLabel}</span>
                        <div className="flex-1 border-t border-gray-200" />
                      </div>
                    )}
                    <div className={['flex gap-3 mb-2', isAdmin ? 'flex-row-reverse' : 'flex-row'].join(' ')}>
                      {!isAdmin && (
                        <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-xs shrink-0">
                          {msg.senderNickname[0]}
                        </div>
                      )}
                      <div className={['flex flex-col max-w-[70%]', isAdmin ? 'items-end' : 'items-start'].join(' ')}>
                        {!isAdmin && <span className="text-xs text-gray-500 mb-1 pl-1">{msg.senderNickname}</span>}
                        <div className={[
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm',
                          isAdmin ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                        ].join(' ')}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.sentAt)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} className="h-1" />
            </div>

            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <textarea
                  value={inputText}
                  onChange={(e: any) => setInputText(e.target.value)}
                  onKeyDown={(e: any) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={isClosed ? '종료된 문의입니다.' : '답변을 입력하세요... (Enter: 전송)'}
                  disabled={!canSend}
                  className="flex-1 bg-transparent resize-none h-10 outline-none p-2 text-sm text-gray-800 disabled:cursor-not-allowed disabled:text-gray-400"
                  rows={1}
                />
                <Button onClick={handleSend} disabled={!canSend} loading={sending} className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 rounded-lg text-sm font-bold shrink-0">
                  전송 ▶
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm flex-col gap-4 bg-slate-50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            왼쪽에서 문의를 선택해주세요
          </div>
        )}
      </div>
    </div>
  )
}
