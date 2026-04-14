/**
 * SeatSelectionPage — 좌석 선택 화면 (SCR-006)
 *
 * 상태 흐름:
 * 진입 → 첫 구역 좌석 조회
 * 구역 탭 클릭 → 해당 sectionId로 재조회
 * AVAILABLE 클릭 → holdSeat() → 내 선택 목록에 추가
 * 내 선택 좌석 클릭 → releaseHold() → 목록에서 제거
 * 결제하기 → /orders/payment (holdTokens + 선택 좌석 정보 전달)
 * 타이머 만료 → 모달 표시 → 확인 시 좌석 재조회
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getSeats, holdSeat, releaseHold } from '@/api/seats'
import { getEventDetail } from '@/api/events'
import type { Seat, SeatSection } from '@/types/seat'
import type { EventDetail } from '@/types/event'
import type { AxiosError } from 'axios'
import {
  CountdownTimer,
  SeatLegend,
  Modal,
  Button,
  LoadingSpinner,
} from '@/components'
import { useToast } from '@/components/Toast'

// ─── 상수 ────────────────────────────────────────────────────

const MAX_HOLD = 4

// ─── 타입 ────────────────────────────────────────────────────

/** 내가 Hold한 좌석 정보 */
interface HeldSeat {
  seatId: number
  seatNumber: string
  sectionName: string
  price: number
  holdToken: string
  expiresAt: string
}

// ─── 에러 코드 → 메시지 ──────────────────────────────────────

function getHoldErrorMessage(error: unknown): string {
  const code = (error as AxiosError<{ code: string }>).response?.data?.code
  switch (code) {
    case 'HOLD_LIMIT_EXCEEDED':    return '최대 4석까지만 선택할 수 있습니다.'
    case 'SEAT_LOCK_FAILED':       return '다른 사용자가 처리 중입니다. 다른 좌석을 선택해주세요.'
    case 'SEAT_ALREADY_HELD':      return '이미 선점된 좌석입니다.'
    case 'SEAT_ALREADY_CONFIRMED': return '이미 예매된 좌석입니다.'
    case 'HOLD_NOT_FOUND':         return '점유 정보가 없거나 이미 만료되었습니다.'
    default:                       return '좌석 선택 중 오류가 발생했습니다.'
  }
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────

/** 구역 탭 */
function SectionTabs({
  sections,
  activeId,
  onSelect,
}: {
  sections: SeatSection[]
  activeId: number
  onSelect: (id: number) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="구역 선택"
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
    >
      {sections.map((s) => (
        <button
          key={s.sectionId}
          role="tab"
          aria-selected={s.sectionId === activeId}
          onClick={() => onSelect(s.sectionId)}
          className={[
            'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            s.sectionId === activeId
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600',
          ].join(' ')}
        >
          {s.sectionName}
          <span className="ml-1.5 text-xs opacity-70">
            {s.price.toLocaleString('ko-KR')}원
          </span>
        </button>
      ))}
    </div>
  )
}

/**
 * 좌석 버튼 — React.memo로 감싸서 다른 좌석 상태 변경 시 불필요한 리렌더 방지
 *
 * 좌석 수가 많을 때 성능 최적화의 핵심.
 * 각 좌석은 자신의 상태(status, isMyHold, isLoading)가 바뀔 때만 리렌더된다.
 */
const SeatButton = ({
  seat,
  isMyHold,
  isLoading,
  onClick,
}: {
  seat: Seat
  isMyHold: boolean
  isLoading: boolean
  onClick: () => void
}) => {
  const isDisabled =
    isLoading ||
    seat.status === 'CONFIRMED' ||
    (seat.status === 'ON_HOLD' && !isMyHold)

  const colorClass =
    isMyHold              ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' :
    seat.status === 'ON_HOLD'   ? 'bg-yellow-400 border-yellow-400 text-white cursor-not-allowed' :
    seat.status === 'CONFIRMED' ? 'bg-gray-400 border-gray-400 text-white cursor-not-allowed' :
                                  'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50'

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`${seat.seatNumber} ${isMyHold ? '선택됨' : seat.status}`}
      aria-pressed={isMyHold}
      title={seat.seatNumber}
      className={[
        'relative flex h-8 w-8 items-center justify-center rounded-sm border text-xs font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1',
        colorClass,
        isLoading ? 'opacity-50' : '',
      ].join(' ')}
    >
      {isLoading ? (
        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        seat.col
      )}
    </button>
  )
}

/** 좌석 그리드 — 행(row) 기준으로 그룹핑해서 렌더링 */
function SeatGrid({
  seats,
  myHoldIds,
  loadingIds,
  onSeatClick,
}: {
  seats: Seat[]
  myHoldIds: Set<number>
  loadingIds: Set<number>
  onSeatClick: (seat: Seat) => void
}) {
  // 행(row) 기준으로 좌석 그룹핑 — useMemo로 seats가 바뀔 때만 재계산
  const rows = useMemo(() => {
    const map = new Map<string, Seat[]>()
    for (const seat of seats) {
      const list = map.get(seat.row) ?? []
      list.push(seat)
      map.set(seat.row, list)
    }
    // 행 이름 오름차순 정렬
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [seats])

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">좌석 정보가 없습니다.</p>
  }

  return (
    <div className="overflow-x-auto">
      {/* 무대 표시 */}
      <div className="mb-6 flex justify-center">
        <div className="rounded-md bg-gray-200 px-10 py-2 text-xs font-medium text-gray-500">
          STAGE
        </div>
      </div>

      <div className="flex flex-col gap-1.5 items-start">
        {rows.map(([rowLabel, rowSeats]) => (
          <div key={rowLabel} className="flex items-center gap-1.5">
            {/* 행 라벨 */}
            <span className="w-6 shrink-0 text-center text-xs font-medium text-gray-400">
              {rowLabel}
            </span>
            {/* 좌석 버튼들 */}
            <div className="flex gap-1">
              {rowSeats
                .sort((a, b) => a.col - b.col)
                .map((seat) => (
                  <SeatButton
                    key={seat.seatId}
                    seat={seat}
                    isMyHold={myHoldIds.has(seat.seatId)}
                    isLoading={loadingIds.has(seat.seatId)}
                    onClick={() => onSeatClick(seat)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 선택 좌석 요약 패널 */
function SelectedSeatPanel({
  heldSeats,
  sectionPrice,
  onPayment,
}: {
  heldSeats: HeldSeat[]
  sectionPrice: number
  onPayment: () => void
}) {
  const totalPrice = heldSeats.reduce((sum, s) => sum + s.price, 0)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-gray-800">
        선택한 좌석 ({heldSeats.length}/{MAX_HOLD})
      </h3>

      {heldSeats.length === 0 ? (
        <p className="text-xs text-gray-400">좌석을 선택해주세요.</p>
      ) : (
        <>
          <ul className="mb-3 space-y-1.5">
            {heldSeats.map((s) => (
              <li key={s.seatId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  <span className="font-medium">{s.sectionName}</span> · {s.seatNumber}
                </span>
                <span className="text-gray-500">{s.price.toLocaleString('ko-KR')}원</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
            <span className="text-gray-700">합계</span>
            <span className="text-blue-600">{totalPrice.toLocaleString('ko-KR')}원</span>
          </div>
        </>
      )}

      <Button
        className="mt-4 w-full"
        size="large"
        disabled={heldSeats.length === 0}
        onClick={onPayment}
      >
        결제하기
      </Button>
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function SeatSelectionPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()
  const { toast }   = useToast()

  // 이벤트 기본 정보 (구역 탭 구성용)
  const [event, setEvent]               = useState<EventDetail | null>(null)
  // 현재 선택된 구역 ID
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null)
  // 현재 구역의 좌석 목록
  const [seats, setSeats]               = useState<Seat[]>([])
  const [seatsLoading, setSeatsLoading] = useState(false)

  // 내가 Hold한 좌석 목록
  const [heldSeats, setHeldSeats]       = useState<HeldSeat[]>([])
  // API 요청 중인 seatId Set (버튼 로딩 표시용)
  const [loadingIds, setLoadingIds]     = useState<Set<number>>(new Set())

  // 타이머 만료 모달
  const [expireModalOpen, setExpireModalOpen] = useState(false)

  // 타이머 만료 중복 호출 방지용 ref
  const expiredRef = useRef(false)

  // ── 이벤트 정보 조회 (구역 탭 구성) ──────────────────────────
  useEffect(() => {
    if (!eventId) return
    getEventDetail(Number(eventId)).then((data) => {
      setEvent(data)
      if (data.sections.length > 0) {
        setActiveSectionId(data.sections[0].sectionId)
      }
    })
  }, [eventId])

  // ── 좌석 조회 ────────────────────────────────────────────────
  const fetchSeats = useCallback(async (sectionId: number) => {
    if (!eventId) return
    setSeatsLoading(true)
    try {
      const data = await getSeats(Number(eventId), sectionId)
      // 현재 구역 섹션의 좌석만 추출
      const section = data.sections.find((s) => s.sectionId === sectionId)
      setSeats(section?.seats ?? [])
    } catch {
      toast.error('좌석 정보를 불러오지 못했습니다.')
    } finally {
      setSeatsLoading(false)
    }
  }, [eventId, toast])

  useEffect(() => {
    if (activeSectionId !== null) fetchSeats(activeSectionId)
  }, [activeSectionId, fetchSeats])

  // ── 구역 탭 변경 ─────────────────────────────────────────────
  const handleSectionChange = (sectionId: number) => {
    setActiveSectionId(sectionId)
  }

  // ── 좌석 클릭 ────────────────────────────────────────────────
  const handleSeatClick = async (seat: Seat) => {
    if (!eventId) return
    const isMyHold = heldSeats.some((h) => h.seatId === seat.seatId)

    // 내가 Hold한 좌석 → 해제
    if (isMyHold) {
      setLoadingIds((prev) => new Set(prev).add(seat.seatId))
      try {
        await releaseHold(Number(eventId), seat.seatId)
        setHeldSeats((prev) => prev.filter((h) => h.seatId !== seat.seatId))
        // 좌석 상태를 AVAILABLE로 업데이트
        setSeats((prev) =>
          prev.map((s) => s.seatId === seat.seatId ? { ...s, status: 'AVAILABLE' } : s)
        )
      } catch {
        toast.error('좌석 해제 중 오류가 발생했습니다.')
      } finally {
        setLoadingIds((prev) => { const next = new Set(prev); next.delete(seat.seatId); return next })
      }
      return
    }

    // 최대 4석 초과 시 토스트
    if (heldSeats.length >= MAX_HOLD) {
      toast.warning('최대 4석까지만 선택할 수 있습니다.')
      return
    }

    // AVAILABLE 좌석 → Hold
    if (seat.status !== 'AVAILABLE') return

    setLoadingIds((prev) => new Set(prev).add(seat.seatId))
    try {
      const res = await holdSeat(Number(eventId), seat.seatId)

      // 현재 구역 섹션 정보에서 가격 조회
      const sectionInfo = event?.sections.find((s) => s.sectionId === activeSectionId)

      setHeldSeats((prev) => [
        ...prev,
        {
          seatId:      seat.seatId,
          seatNumber:  seat.seatNumber,
          sectionName: sectionInfo?.sectionName ?? '',
          price:       sectionInfo?.price ?? 0,
          holdToken:   res.holdToken,
          expiresAt:   res.expiresAt,
        },
      ])
      // 좌석 상태를 ON_HOLD로 업데이트
      setSeats((prev) =>
        prev.map((s) => s.seatId === seat.seatId ? { ...s, status: 'ON_HOLD' } : s)
      )
      expiredRef.current = false
    } catch (error) {
      toast.error(getHoldErrorMessage(error))
      // 서버 상태와 동기화를 위해 좌석 재조회
      if (activeSectionId !== null) fetchSeats(activeSectionId)
    } finally {
      setLoadingIds((prev) => { const next = new Set(prev); next.delete(seat.seatId); return next })
    }
  }

  // ── 타이머 만료 처리 ─────────────────────────────────────────
  const handleExpire = useCallback(() => {
    if (expiredRef.current) return
    expiredRef.current = true
    setExpireModalOpen(true)
  }, [])

  // 만료 모달 확인 → 상태 초기화 후 좌석 재조회
  const handleExpireConfirm = () => {
    setHeldSeats([])
    setExpireModalOpen(false)
    expiredRef.current = false
    if (activeSectionId !== null) fetchSeats(activeSectionId)
  }

  // ── 결제하기 ─────────────────────────────────────────────────
  const handlePayment = () => {
    navigate('/orders/payment', {
      state: {
        holdTokens:  heldSeats.map((h) => h.holdToken),
        selectedSeats: heldSeats,
        eventId:     Number(eventId),
      },
    })
  }

  // ── 파생 상태 ────────────────────────────────────────────────

  // 내가 Hold한 seatId Set (SeatGrid에 전달)
  const myHoldIds = useMemo(
    () => new Set(heldSeats.map((h) => h.seatId)),
    [heldSeats]
  )

  // 가장 빠른 expiresAt (타이머 기준)
  const earliestExpiresAt = useMemo(() => {
    if (heldSeats.length === 0) return null
    return heldSeats.reduce((min, h) =>
      new Date(h.expiresAt) < new Date(min) ? h.expiresAt : min,
      heldSeats[0].expiresAt
    )
  }, [heldSeats])

  // 현재 활성 구역 정보
  const activeSection = event?.sections.find((s) => s.sectionId === activeSectionId)

  // ── 렌더링 ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/events/${eventId}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            aria-label="이벤트 상세로 돌아가기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            공연 상세
          </Link>
          {event && (
            <h1 className="text-base font-bold text-gray-900 truncate max-w-xs">
              {event.title}
            </h1>
          )}
        </div>

        {/* 카운트다운 타이머 — Hold한 좌석이 있을 때만 표시 */}
        {earliestExpiresAt && (
          <CountdownTimer
            expiresAt={earliestExpiresAt}
            onExpire={handleExpire}
          />
        )}
      </div>

      {/* 메인 레이아웃 */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* 좌측: 구역 탭 + 좌석 그리드 */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* 구역 탭 */}
          {event && (
            <SectionTabs
              sections={event.sections}
              activeId={activeSectionId ?? -1}
              onSelect={handleSectionChange}
            />
          )}

          {/* 좌석 그리드 */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            {seatsLoading ? (
              <LoadingSpinner />
            ) : (
              <SeatGrid
                seats={seats}
                myHoldIds={myHoldIds}
                loadingIds={loadingIds}
                onSeatClick={handleSeatClick}
              />
            )}
          </div>

          {/* 범례 */}
          <SeatLegend />
        </div>

        {/* 우측: 선택 좌석 요약 패널 */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24">
          <SelectedSeatPanel
            heldSeats={heldSeats}
            sectionPrice={activeSection?.price ?? 0}
            onPayment={handlePayment}
          />
        </aside>

      </div>

      {/* 타이머 만료 모달 */}
      <Modal
        isOpen={expireModalOpen}
        onClose={handleExpireConfirm}
        onConfirm={handleExpireConfirm}
        title="좌석 선점 시간이 만료되었습니다"
        confirmLabel="좌석 다시 선택하기"
        cancelLabel="닫기"
      >
        <p>선점 시간(5분)이 초과되어 선택한 좌석이 해제되었습니다.</p>
        <p className="mt-1 text-gray-400">좌석을 다시 선택해주세요.</p>
      </Modal>

    </div>
  )
}

export default SeatSelectionPage
