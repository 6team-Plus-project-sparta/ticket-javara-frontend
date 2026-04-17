/**
 * AdminChatPage — 관리자용 CS 채팅 대시보드
 *
 * 상단: 통계 카드 (전체 / 대기중 / 진행중 / 종료)
 * 하단: 채팅방 목록(좌) + 메시지 영역(우)
 */

import { useEffect, useRef, useState } from 'react'
import { getAdminChatRooms, getChatMessages, closeChatRoom } from '@/api/chat'
import type { AdminChatRoom, ChatMessage } from '@/types/chat'
import { Button, LoadingSpinner } from '@/components'
import { useToast } from '@/components/Toast'
import { useStompChat } from '@/hooks/useStompChat'

// ─── 탭 ──────────────────────────────────────────────────────

type RoomFilter = 'ALL' | 'OPEN' | 'CLOSED'

// ─── 유틸 ────────────────────────────────────────────────────

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

// ─── 아이콘 ──────────────────────────────────────────────────

const IconAll = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const IconWaiting = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconActive = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
  </svg>
)

const IconDone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// ─── 통계 카드 ────────────────────────────────────────────────

function StatCard({
  label, count, icon, color, active, onClick,
}: {
  label: string
  count: number
  icon: React.ReactNode
  color: string   // tailwind text-* 클래스
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-1 items-center justify-between rounded-xl border px-5 py-4 text-left transition-all',
        active
          ? 'border-primary-300 bg-primary-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm',
      ].join(' ')}
    >
      <div>
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className={['mt-1 text-2xl font-extrabold', active ? 'text-primary-600' : 'text-gray-800'].join(' ')}>
          {count}
        </p>
      </div>
      <span className={[color, active ? 'opacity-100' : 'opacity-40'].join(' ')}>
        {icon}
      </span>
    </button>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function AdminChatPage() {
  const { toast } = useToast()

  const [activeTab, setActiveTab]           = useState<RoomFilter>('ALL')
  const [allRooms, setAllRooms]             = useState<AdminChatRoom[]>([])
  const [roomsLoading, setRoomsLoading]     = useState(true)
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [messages, setMessages]             = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [inputText, setInputText]           = useState('')
  const [closing, setClosing]               = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── 전체 목록 조회 (마운트 1회) ──────────────────────────────
  const fetchAllRooms = async () => {
    setRoomsLoading(true)
    try {
      // 전체 조회 (OPEN + CLOSED 합산)
      const [openRes, closedRes] = await Promise.all([
        getAdminChatRooms({ status: 'OPEN',   page: 0, size: 100 }),
        getAdminChatRooms({ status: 'CLOSED', page: 0, size: 100 }),
      ])
      setAllRooms([...(openRes.content ?? []), ...(closedRes.content ?? [])])
    } catch {
      toast.error('채팅방 목록을 불러오지 못했습니다.')
    } finally {
      setRoomsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllRooms()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 탭 필터링 ────────────────────────────────────────────────
  const filteredRooms = activeTab === 'ALL'
    ? allRooms
    : allRooms.filter((r) => r.status === activeTab)

  // ── 통계 ─────────────────────────────────────────────────────
  const totalCount  = allRooms.length
  const openCount   = allRooms.filter((r) => r.status === 'OPEN').length
  const closedCount = allRooms.filter((r) => r.status === 'CLOSED').length

  // ── 채팅방 선택 → 메시지 조회 ────────────────────────────────
  useEffect(() => {
    if (!selectedRoomId) return
    setMessagesLoading(true)
    getChatMessages(selectedRoomId, { size: 50 })
      .then((res) => {
        setMessages([...(res.messages ?? [])].reverse())
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .catch(() => toast.error('메시지를 불러오지 못했습니다.'))
      .finally(() => setMessagesLoading(false))
  }, [selectedRoomId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── WebSocket ─────────────────────────────────────────────────
  const { connectionStatus, sendMessage } = useStompChat({
    chatRoomId: selectedRoomId,
    onMessage: (msg) => {
      setMessages((prev) => [...prev, msg])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    },
    onError: (err) => toast.error(err),
  })

  // ── 전송 ─────────────────────────────────────────────────────
  const handleSend = () => {
    const content = inputText.trim()
    if (!content || !selectedRoomId) return
    sendMessage(content)
    setInputText('')
  }

  // ── 종료 ─────────────────────────────────────────────────────
  const handleClose = async () => {
    if (!selectedRoomId) return
    setClosing(true)
    try {
      await closeChatRoom(selectedRoomId)
      toast.success('채팅방이 종료되었습니다.')
      await fetchAllRooms()
      setSelectedRoomId(null)
      setMessages([])
    } catch {
      toast.error('채팅방 종료 중 오류가 발생했습니다.')
    } finally {
      setClosing(false)
    }
  }

  const selectedRoom = allRooms.find((r) => r.chatRoomId === selectedRoomId)

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">

      {/* ── 상단: 헤더 + 통계 카드 ── */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">CS 문의 관리</h1>
        <p className="mt-0.5 text-sm text-gray-400">고객 문의를 관리하고 응답하세요</p>

        {/* 통계 카드 4개 */}
        <div className="mt-4 flex gap-3">
          <StatCard
            label="전체 문의"
            count={totalCount}
            icon={<IconAll />}
            color="text-gray-400"
            active={activeTab === 'ALL'}
            onClick={() => setActiveTab('ALL')}
          />
          <StatCard
            label="진행중"
            count={openCount}
            icon={<IconActive />}
            color="text-green-500"
            active={activeTab === 'OPEN'}
            onClick={() => setActiveTab('OPEN')}
          />
          <StatCard
            label="종료"
            count={closedCount}
            icon={<IconDone />}
            color="text-gray-400"
            active={activeTab === 'CLOSED'}
            onClick={() => setActiveTab('CLOSED')}
          />
        </div>
      </div>

      {/* ── 하단: 채팅 영역 ── */}
      <div className="flex flex-1 gap-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

        {/* 좌측: 채팅방 목록 */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-gray-100">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold text-gray-500">
              {activeTab === 'ALL' ? '전체' : activeTab === 'OPEN' ? '진행중' : '종료'} {filteredRooms.length}건
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="small" /></div>
            ) : filteredRooms.length === 0 ? (
              <p className="py-10 text-center text-xs text-gray-400">문의 내역이 없습니다.</p>
            ) : (
              <ul>
                {filteredRooms.map((room) => (
                  <li key={room.chatRoomId}>
                    <button
                      onClick={() => setSelectedRoomId(room.chatRoomId)}
                      className={[
                        'w-full border-b border-gray-50 px-4 py-3 text-left transition-colors',
                        selectedRoomId === room.chatRoomId ? 'bg-primary-50' : 'hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {/* 상태 점 */}
                          <span className={[
                            'h-2 w-2 rounded-full shrink-0',
                            room.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-300',
                          ].join(' ')} />
                          <span className="text-sm font-semibold text-gray-800 truncate max-w-[110px]">
                            {room.userNickname}
                          </span>
                        </div>
                        <span className="text-xs text-gray-300">#{room.chatRoomId}</span>
                      </div>
                      <p className="ml-4 text-xs text-gray-400 truncate">{room.lastMessage || '(메시지 없음)'}</p>
                      <p className="ml-4 mt-1 text-xs text-gray-300">{formatDate(room.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* 우측: 메시지 영역 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {!selectedRoomId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-300">
                <IconAll />
              </div>
              <p className="text-sm text-gray-400">왼쪽에서 채팅방을 선택해주세요</p>
            </div>
          ) : (
            <>
              {/* 채팅방 헤더 */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                    {selectedRoom?.userNickname?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedRoom?.userNickname}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={[
                        'h-1.5 w-1.5 rounded-full',
                        connectionStatus === 'connected'  ? 'bg-green-500' :
                        connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                        'bg-gray-300',
                      ].join(' ')} />
                      <span className="text-xs text-gray-400">
                        {connectionStatus === 'connected'  ? '연결됨' :
                         connectionStatus === 'connecting' ? '연결 중...' : '연결 끊김'}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedRoom?.status === 'OPEN' ? (
                  <Button variant="danger" size="small" loading={closing} onClick={handleClose}>
                    문의 종료
                  </Button>
                ) : (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">종료된 문의</span>
                )}
              </div>

              {/* 메시지 리스트 */}
              <div className="flex-1 overflow-y-auto bg-slate-100 px-5 py-4 space-y-3">
                {messagesLoading ? (
                  <LoadingSpinner />
                ) : messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">메시지가 없습니다.</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderRole === 'ADMIN'
                    return (
                      <div key={msg.chatMessageId} className={['flex gap-2', isMe ? 'flex-row-reverse' : 'flex-row'].join(' ')}>
                        {!isMe && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                            {msg.senderNickname?.charAt(0) ?? '?'}
                          </div>
                        )}
                        <div className={['flex flex-col gap-0.5', isMe ? 'items-end' : 'items-start'].join(' ')}>
                          <span className="text-xs text-gray-400">{msg.senderNickname}</span>
                          <div className={[
<<<<<<< HEAD
                            'max-w-xs rounded-2xl px-4 py-2.5 text-sm break-words shadow-sm',
                            isMe
                              ? 'rounded-tr-sm bg-orange-100 text-gray-900'
                              : 'rounded-tl-sm border border-blue-100 bg-blue-50 text-gray-900',
=======
<<<<<<< HEAD
                            'max-w-xs rounded-2xl px-4 py-2.5 text-sm break-words shadow-sm',
                            isMe
                              ? 'rounded-tr-sm bg-orange-100 text-gray-900'
                              : 'rounded-tl-sm border border-blue-100 bg-blue-50 text-gray-900',
=======
                            'max-w-xs rounded-2xl px-4 py-2.5 text-sm break-words',
                            isMe
                              ? 'rounded-tr-sm bg-brand-700 text-white'
                              : 'rounded-tl-sm border border-gray-100 bg-white text-gray-800 shadow-sm',
>>>>>>> dev
>>>>>>> dev
                          ].join(' ')}>
                            {msg.content}
                          </div>
                          <span className="text-xs text-gray-300">{formatTime(msg.sentAt)}</span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* 입력창 */}
              <div className="border-t border-gray-100 bg-white px-4 py-3">
                {selectedRoom?.status === 'CLOSED' ? (
                  <p className="py-1 text-center text-xs text-gray-400">종료된 문의입니다.</p>
                ) : (
                  <div className="flex items-end gap-2">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                      }}
                      placeholder={connectionStatus === 'connected' ? '답변을 입력하세요 (Enter: 전송)' : '연결 중...'}
                      disabled={connectionStatus !== 'connected'}
                      rows={2}
                      className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-50"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={connectionStatus !== 'connected' || !inputText.trim()}
                      className="shrink-0 h-10 w-10 p-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminChatPage
