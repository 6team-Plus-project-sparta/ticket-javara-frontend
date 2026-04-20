/**
 * ChatPage — 사용자 CS 채팅 화면 (SCR-013)
 *
 * 동작 흐름:
 * 1. 진입 → POST /api/chat/rooms (채팅방 생성 또는 기존 방 반환)
 * 2. GET /api/chat/rooms/{id}/messages (최근 메시지 조회)
 * 3. WebSocket 연결 → /sub/chat/room/{id} 구독
 * 4. 메시지 전송 → /pub/chat/message 발행
 * 5. 스크롤 최상단 도달 시 이전 메시지 추가 조회 (cursor 기반)
 * 6. 문의 종료 → PATCH /api/chat/rooms/{id}/close
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createChatRoom, getChatMessages, closeChatRoom } from '@/api/chat'
import type { ChatMessage, ChatRoom } from '@/types/chat'
import { Button, LoadingSpinner, Modal } from '@/components'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'
import { useStompChat, type ConnectionStatus } from '@/hooks/useStompChat'

// ─── 상수 ────────────────────────────────────────────────────

const MESSAGE_PAGE_SIZE = 30

// ─── 유틸 ────────────────────────────────────────────────────

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

// ─── 서브 컴포넌트 ────────────────────────────────────────────

/** 연결 상태 배지 */
function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    connecting:   { dot: 'bg-yellow-400 animate-pulse', text: '연결 중...',  textColor: 'text-yellow-600' },
    connected:    { dot: 'bg-green-500',                text: '연결됨',      textColor: 'text-green-600' },
    disconnected: { dot: 'bg-gray-400',                 text: '연결 끊김',   textColor: 'text-gray-500' },
    error:        { dot: 'bg-red-500',                  text: '연결 오류',   textColor: 'text-red-500' },
  }[status]

  return (
    <div className="flex items-center gap-1.5">
      <span className={['h-2 w-2 rounded-full', config.dot].join(' ')} aria-hidden="true" />
      <span className={['text-xs font-medium', config.textColor].join(' ')}>{config.text}</span>
    </div>
  )
}

/** 메시지 버블 */
function MessageBubble({
  message,
  isMe,
}: {
  message: ChatMessage
  isMe: boolean
}) {
  return (
    <div className={['flex gap-2', isMe ? 'flex-row-reverse' : 'flex-row'].join(' ')}>
      {/* 아바타 — 관리자만 표시 */}
      {!isMe && (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
          aria-hidden="true"
        >
          CS
        </div>
      )}

      <div className={['flex flex-col gap-1', isMe ? 'items-end' : 'items-start'].join(' ')}>
        {/* 발신자 이름 — 관리자만 표시 */}
        {!isMe && (
          <span className="text-xs text-gray-400">{message.senderNickname}</span>
        )}

        {/* 말풍선 */}
        <div
          className={[
            'max-w-xs rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm',
            isMe
              ? 'rounded-tr-sm bg-orange-100 text-gray-900'
              : 'rounded-tl-sm bg-blue-50 border border-blue-100 text-gray-900',
          ].join(' ')}
        >
          {message.content}
        </div>

        {/* 시간 */}
        <span className="text-xs text-gray-400">{formatTime(message.sentAt)}</span>
      </div>
    </div>
  )
}

/** 날짜 구분선 */
function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-2" aria-label={`${date} 메시지`}>
      <div className="flex-1 border-t border-gray-100" aria-hidden="true" />
      <span className="text-xs text-gray-400">{date}</span>
      <div className="flex-1 border-t border-gray-100" aria-hidden="true" />
    </div>
  )
}

// ─── 날짜 구분선 삽입 유틸 ───────────────────────────────────

function getDateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function ChatPage() {
  const { user }  = useAuth()
  const { toast } = useToast()

  // 채팅방 상태
  const [room, setRoom]               = useState<ChatRoom | null>(null)
  const [roomLoading, setRoomLoading] = useState(true)

  // 메시지 목록
  const [messages, setMessages]         = useState<ChatMessage[]>([])
  const [nextCursor, setNextCursor]     = useState<number | null>(null)
  const [hasNext, setHasNext]           = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  // 입력창
  const [inputText, setInputText] = useState('')
  const [sending, setSending]     = useState(false)

  // 종료 모달
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [closing, setClosing]               = useState(false)

  // 스크롤 ref
  const bottomRef        = useRef<HTMLDivElement>(null)
  const listRef          = useRef<HTMLDivElement>(null)
  const prevScrollHeight = useRef(0)

  // 무한 호출 방지용 ref
  const hasNextRef        = useRef(false)
  const historyLoadingRef = useRef(false)
  const nextCursorRef     = useRef<number | null>(null)
  const roomRef           = useRef<ChatRoom | null>(null)

  // ref를 state와 동기화
  hasNextRef.current        = hasNext
  historyLoadingRef.current = historyLoading
  nextCursorRef.current     = nextCursor
  roomRef.current           = room

  // ── 채팅방 생성 (마운트 1회만) ───────────────────────────────
  useEffect(() => {
    createChatRoom()
      .then((room) => {
        console.log('[ChatPage] 채팅방 생성/조회:', room)
        setRoom(room)
      })
      .catch((e) => {
        console.error('[ChatPage] 채팅방 생성 실패:', e)
        toast.error('채팅방을 불러오지 못했습니다.')
      })
      .finally(() => setRoomLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 초기 메시지 조회 (room이 처음 설정될 때 1회) ─────────────
  useEffect(() => {
    if (!room) return
    getChatMessages(room.chatRoomId, { size: MESSAGE_PAGE_SIZE })
      .then((res) => {
        setMessages([...(res.messages ?? [])].reverse())
        setNextCursor(res.nextCursor ?? null)
        setHasNext(res.hasNext ?? false)
      })
      .catch(() => toast.error('메시지를 불러오지 못했습니다.'))
  }, [room?.chatRoomId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 이전 메시지 추가 조회 — ref 기반으로 의존성 최소화 ────────
  const loadMoreMessages = useCallback(async () => {
    const currentRoom   = roomRef.current
    const currentCursor = nextCursorRef.current
    if (!currentRoom || !hasNextRef.current || historyLoadingRef.current || currentCursor === null) return

    setHistoryLoading(true)
    prevScrollHeight.current = listRef.current?.scrollHeight ?? 0
    try {
      const res = await getChatMessages(currentRoom.chatRoomId, {
        cursor: currentCursor,
        size: MESSAGE_PAGE_SIZE,
      })
      setMessages((prev) => [...[...(res.messages ?? [])].reverse(), ...prev])
      setNextCursor(res.nextCursor ?? null)
      setHasNext(res.hasNext ?? false)
    } catch {
      toast.error('이전 메시지를 불러오지 못했습니다.')
    } finally {
      setHistoryLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 이전 메시지 로드 후 스크롤 위치 보정 (위로 튀지 않게)
  useEffect(() => {
    if (!historyLoading && prevScrollHeight.current > 0 && listRef.current) {
      const diff = listRef.current.scrollHeight - prevScrollHeight.current
      listRef.current.scrollTop = diff
      prevScrollHeight.current = 0
    }
  }, [messages, historyLoading])

  // 새 메시지 수신 시 맨 아래로 스크롤
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // onError를 ref로 감싸서 매 렌더마다 새 함수 참조 생성 방지
  const onErrorRef = useRef((err: string) => toast.error(err))

  // ── WebSocket 연결 ────────────────────────────────────────────
  const { connectionStatus, sendMessage: stompSend } = useStompChat({
    chatRoomId: room?.chatRoomId ?? null,
    onMessage: (msg) => {
      setMessages((prev) => [...prev, msg])
      scrollToBottom()
    },
    onError: onErrorRef.current,
  })

  // 초기 메시지 로드 후 맨 아래로 스크롤
  useEffect(() => {
    if (messages.length > 0 && !historyLoading) {
      scrollToBottom()
    }
  }, [room]) // 방이 설정될 때 1회

  // ── 스크롤 최상단 감지 → 이전 메시지 로드 ────────────────────
  const handleScroll = useCallback(() => {
    if (!listRef.current) return
    if (listRef.current.scrollTop === 0 && hasNext) {
      loadMoreMessages()
    }
  }, [hasNext, loadMoreMessages])

  // ── 메시지 전송 ──────────────────────────────────────────────
  const handleSend = async () => {
    const content = inputText.trim()
    if (!content || !room || room.status === 'COMPLETED') return
    setSending(true)
    try {
      stompSend(content)
      setInputText('')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter는 줄바꿈, Enter만 누르면 전송
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── 채팅방 종료 ──────────────────────────────────────────────
  const handleClose = async () => {
    if (!room) return
    setClosing(true)
    try {
      await closeChatRoom(room.chatRoomId)
      setRoom((prev) => prev ? { ...prev, status: 'COMPLETED' } : prev)
      setCloseModalOpen(false)
      toast.success('문의가 종료되었습니다.')
    } catch {
      toast.error('채팅방 종료 중 오류가 발생했습니다.')
    } finally {
      setClosing(false)
    }
  }

  // ── 날짜 구분선 삽입 로직 ────────────────────────────────────
  const renderMessages = () => {
    const items: React.ReactNode[] = []
    let lastDate = ''

    messages.forEach((msg) => {
      const dateLabel = getDateLabel(msg.sentAt)
      if (dateLabel !== lastDate) {
        items.push(<DateDivider key={`date-${msg.sentAt}`} date={dateLabel} />)
        lastDate = dateLabel
      }
      items.push(
        <MessageBubble
          key={msg.chatMessageId}
          message={msg}
          isMe={msg.senderId === user?.userId}
        />
      )
    })
    return items
  }

  const isClosed   = room?.status === 'COMPLETED'
  const canSend    = connectionStatus === 'connected' && !isClosed && inputText.trim().length > 0

  // ── 렌더링 ───────────────────────────────────────────────────

  if (roomLoading) return <LoadingSpinner />

  return (
    <div className="flex h-full flex-col max-w-2xl mx-auto">

      {/* 상단 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-gray-900">고객센터 채팅</h1>
          <ConnectionBadge status={connectionStatus} />
        </div>
        <div className="flex items-center gap-2">
          {/* 채팅방 번호 */}
          {room && (
            <span className="text-xs text-gray-400 font-mono">#{room.chatRoomId}</span>
          )}
          {/* 문의 종료 버튼 */}
          {!isClosed && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCloseModalOpen(true)}
            >
              문의 종료
            </Button>
          )}
        </div>
      </div>

      {/* 종료 안내 배너 */}
      {isClosed && (
        <div className="bg-gray-100 px-4 py-2 text-center text-xs text-gray-500">
          종료된 문의입니다. 새 문의는 페이지를 새로고침해주세요.
        </div>
      )}

      {/* 메시지 리스트 */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-slate-100 px-4 py-4 space-y-3"
      >
        {/* 이전 메시지 로딩 */}
        {historyLoading && (
          <div className="flex justify-center py-2">
            <LoadingSpinner size="small" label="이전 메시지 불러오는 중" />
          </div>
        )}

        {/* 더 불러올 메시지 없음 안내 */}
        {!hasNext && messages.length > 0 && (
          <p className="text-center text-xs text-gray-300 py-1">
            대화 시작
          </p>
        )}

        {/* 메시지 없음 */}
        {messages.length === 0 && !historyLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-sm text-gray-500">안녕하세요! 무엇을 도와드릴까요?</p>
            <p className="text-xs text-gray-400">메시지를 입력해 문의를 시작하세요.</p>
          </div>
        )}

        {renderMessages()}

        {/* 스크롤 앵커 */}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="border-t border-gray-100 bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isClosed
                ? '종료된 문의입니다.'
                : connectionStatus !== 'connected'
                ? '연결 중...'
                : '메시지를 입력하세요. (Enter: 전송, Shift+Enter: 줄바꿈)'
            }
            disabled={isClosed || connectionStatus !== 'connected' || sending}
            rows={2}
            aria-label="메시지 입력"
            className={[
              'flex-1 resize-none rounded-xl border px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              'transition-colors',
              isClosed ? 'border-gray-100' : 'border-gray-200',
            ].join(' ')}
          />
          <Button
            onClick={handleSend}
            disabled={!canSend}
            loading={sending}
            aria-label="전송"
            className="shrink-0 h-10 w-10 rounded-xl p-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>

      {/* 문의 종료 확인 모달 */}
      <Modal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onConfirm={handleClose}
        title="문의를 종료하시겠습니까?"
        confirmLabel="문의 종료"
        cancelLabel="계속 문의하기"
        confirmVariant="danger"
        loading={closing}
      >
        <p>종료 후에는 이 채팅방에서 더 이상 메시지를 보낼 수 없습니다.</p>
        <p className="mt-1 text-gray-400">새 문의는 페이지를 새로고침하면 시작할 수 있습니다.</p>
      </Modal>

    </div>
  )
}

export default ChatPage
