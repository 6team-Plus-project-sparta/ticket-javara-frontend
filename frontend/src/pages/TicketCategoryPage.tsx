/**
 * TicketCategoryPage — 카테고리별 이벤트 목록
 * URL: /ticket/:category (concert | musical | sports | display | etc)
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEvents } from '@/api/events'
import type { EventSummary, EventCategory, EventStatus } from '@/types/event'
import { LoadingSpinner, EmptyState, Pagination, StatusBadge } from '@/components'

// ─── 상수 ────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
    concert:    '콘서트',
    musical:    '뮤지컬',
    sports:     '스포츠',
    display:    '전시',
    etc:        '기타',
}

const SORT_OPTIONS = [
    { label: '최신 등록순',    value: 'createdAt,desc' },
    { label: '공연일 빠른 순', value: 'eventDate,asc' },
    { label: '낮은 가격 순',   value: 'minPrice,asc' },
    { label: '높은 가격 순',   value: 'minPrice,desc' },
]

// ─── 유틸 ────────────────────────────────────────────────────

const formatEventDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        weekday: 'short', hour: '2-digit', minute: '2-digit',
    })

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원~`

function resolveCardStatus(event: EventSummary): EventStatus {
    if (event.eventStatus) return event.eventStatus
    if (new Date(event.eventDate).getTime() < Date.now()) return 'ENDED'
    if (event.remainingSeats === 0) return 'SOLD_OUT'
    return 'ON_SALE'
}

// ─── 이벤트 카드 ──────────────────────────────────────────────

function EventCard({ event, onClick }: { event: EventSummary; onClick: () => void }) {
    const cardStatus = resolveCardStatus(event)
    const isSoldOut  = cardStatus === 'SOLD_OUT'
    const isEnded    = cardStatus === 'ENDED' || cardStatus === 'CANCELLED'
    const isDisabled = isSoldOut || isEnded

    return (
        <article
            onClick={isDisabled ? undefined : onClick}
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            onKeyDown={(e) => !isDisabled && e.key === 'Enter' && onClick()}
            aria-label={`${event.title} 상세 보기`}
            aria-disabled={isDisabled}
            className={[
                'group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow',
                isDisabled ? 'cursor-default opacity-75' : 'cursor-pointer hover:shadow-md',
            ].join(' ')}
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {event.thumbnailUrl ? (
                    <img
                        src={event.thumbnailUrl}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-300" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                    </div>
                )}
                {(isSoldOut || isEnded) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700">
              {isSoldOut ? '매진' : '종료됨'}
            </span>
                    </div>
                )}
                <div className="absolute left-2 top-2">
                    <StatusBadge status={cardStatus} />
                </div>
            </div>

            <div className="p-4">
                <p className="mb-1 text-xs text-gray-400">{event.venueName}</p>
                <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-[#FD002D] transition-colors">
                    {event.title}
                </h3>
                <p className="mb-3 text-xs text-gray-500">{formatEventDate(event.eventDate)}</p>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#FD002D]">{formatPrice(event.minPrice)}</span>
                    {isSoldOut ? (
                        <span className="text-xs font-semibold text-red-500">매진</span>
                    ) : isEnded ? (
                        <span className="text-xs font-semibold text-gray-400">예매종료</span>
                    ) : (
                        <span className="text-xs text-gray-400">잔여 {event.remainingSeats.toLocaleString()}석</span>
                    )}
                </div>
            </div>
        </article>
    )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function TicketCategoryPage() {
    const { category } = useParams<{ category: string }>()
    const navigate = useNavigate()

    const [events, setEvents]               = useState<EventSummary[]>([])
    const [totalPages, setTotalPages]       = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [currentPage, setCurrentPage]     = useState(0)
    const [loading, setLoading]             = useState(true)
    const [selectedSort, setSelectedSort]   = useState('createdAt,desc')

    // URL 파라미터를 백엔드 ENUM으로 변환
    const currentCategory = (category?.toUpperCase() ?? 'CONCERT') as EventCategory
    const categoryLabel   = CATEGORY_LABEL[category ?? 'concert'] ?? '전체'

    useEffect(() => {
        setCurrentPage(0)
    }, [category])

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true)
            try {
                const res = await getEvents({
                    page: currentPage,
                    size: 12,
                    sort: selectedSort,
                    category: currentCategory,
                    // status 파라미터 제거 - 모든 상태의 이벤트 표시
                })
                setEvents(res.content ?? [])
                setTotalPages(res.totalPages ?? 0)
                setTotalElements(res.totalElements ?? 0)
            } catch {
                setEvents([])
                setTotalElements(0)
            } finally {
                setLoading(false)
            }
        }
        fetchEvents()
    }, [currentPage, currentCategory, selectedSort])

    return (
        <div className="space-y-6">

            {/* 페이지 타이틀 + 정렬 */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-extrabold text-gray-900">
                    {categoryLabel}
                    <span className="ml-2 text-sm font-normal text-gray-400">
            {loading ? '' : `총 ${totalElements}개`}
          </span>
                </h1>
                <select
                    value={selectedSort}
                    onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(0) }}
                    aria-label="정렬 기준"
                    className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FD002D]"
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* 이벤트 목록 */}
            {loading ? (
                <LoadingSpinner />
            ) : events.length === 0 ? (
                <EmptyState
                    title={`예매 중인 ${categoryLabel} 공연이 없습니다`}
                    description="다른 카테고리를 선택해보세요"
                    actionLabel="홈으로 돌아가기"
                    onAction={() => navigate('/')}
                />
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {events.map((event) => (
                        <EventCard
                            key={event.eventId}
                            event={event}
                            onClick={() => navigate(`/events/${event.eventId}`)}
                        />
                    ))}
                </div>
            )}

            {!loading && totalPages > 1 && (
                <div className="mt-8">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

        </div>
    )
}

export default TicketCategoryPage