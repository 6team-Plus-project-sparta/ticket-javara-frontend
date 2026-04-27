/**
 * HomePage — 메인 홈 화면 (SCR-003)
 *
 * 구성 요소:
 * 1. 히어로 배너
 * 2. 장르별 랭킹
 * 3. 인기 검색어
 * 4. 카테고리 + 정렬 필터
 * 5. 이벤트 카드 목록 (3열 그리드)
 * 6. 페이지네이션
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getEvents } from '@/api/events'
import { getPopularKeywords, clickPopularKeyword } from '@/api/search'
import type { EventSummary, EventCategory, EventStatus } from '@/types/event'
import type { PopularKeyword } from '@/types/search'
import CarouselBanner from '@/components/CarouselBanner'
import {
    SearchBar,
    LoadingSpinner,
    EmptyState,
    Pagination,
    StatusBadge,
} from '@/components'
import { useAuth } from '@/contexts/AuthContext'

// ─── 상수 ────────────────────────────────────────────────────

const CATEGORIES: { label: string; value: EventCategory | 'ALL' }[] = [
    { label: '전체',   value: 'ALL' },
    { label: '콘서트', value: 'CONCERT' },
    { label: '뮤지컬', value: 'MUSICAL' },
    { label: '스포츠', value: 'SPORTS' },
    { label: '전시',   value: 'DISPLAY' },
    { label: '기타',   value: 'ETC' },
]

const GENRE_TABS: { label: string; value: EventCategory }[] = [
    { label: '콘서트', value: 'CONCERT' },
    { label: '뮤지컬', value: 'MUSICAL' },
    { label: '스포츠', value: 'SPORTS' },
    { label: '전시',   value: 'DISPLAY' },
    { label: '기타',   value: 'ETC' },
]

const STATUS_TABS: { label: string; value: 'ALL' | EventStatus }[] = [
    { label: '전체',   value: 'ALL' },
    { label: '예매중', value: 'ON_SALE' },
    { label: '매진',   value: 'SOLD_OUT' },
]

const ADMIN_STATUS_TABS: { label: string; value: 'ALL' | EventStatus }[] = [
    { label: '전체',   value: 'ALL' },
    { label: '예매중', value: 'ON_SALE' },
    { label: '매진',   value: 'SOLD_OUT' },
    { label: '종료됨', value: 'ENDED' },
]

const SORT_OPTIONS = [
    { label: '최신 등록순',    value: 'createdAt,desc' },
    { label: '공연일 빠른 순', value: 'eventDate,asc' },
    { label: '공연일 늦은 순', value: 'eventDate,desc' },
    { label: '낮은 가격 순',   value: 'minPrice,asc' },
    { label: '높은 가격 순',   value: 'minPrice,desc' },
]

// ─── 유틸 ────────────────────────────────────────────────────

const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        weekday: 'short', hour: '2-digit', minute: '2-digit',
    })
}

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원~`

function resolveCardStatus(event: EventSummary): EventStatus {
    if (event.eventStatus) return event.eventStatus
    if (new Date(event.eventDate).getTime() < Date.now()) return 'ENDED'
    if (event.remainingSeats === 0) return 'SOLD_OUT'
    return 'ON_SALE'
}

// ─── 장르별 랭킹 섹션 ────────────────────────────────────────

function GenreRanking({ onEventClick }: { onEventClick: (eventId: number) => void }) {
    const navigate = useNavigate()
    const [activeGenre, setActiveGenre] = useState<EventCategory>('CONCERT')
    const [rankEvents, setRankEvents]   = useState<EventSummary[]>([])
    const [rankLoading, setRankLoading] = useState(true)

    const fetchRanking = useCallback(async (category: EventCategory) => {
        setRankLoading(true)
        try {
            const res = await getEvents({
                status: 'ON_SALE',
                category,
                sort: 'createdAt,desc',
                size: 5,
                page: 0,
            })
            setRankEvents(res.content ?? [])
        } catch {
            setRankEvents([])
        } finally {
            setRankLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchRanking(activeGenre)
    }, [activeGenre, fetchRanking])

    const activeLabel = GENRE_TABS.find(t => t.value === activeGenre)?.label ?? ''

    return (
        <section aria-label="장르별 랭킹" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-gray-900 text-center">🏆 장르별 랭킹</h2>

            {/* 장르 탭 */}
            <div className="flex justify-center gap-1 border-b border-gray-200" role="tablist" aria-label="장르 선택">
                {GENRE_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        role="tab"
                        aria-selected={activeGenre === tab.value}
                        onClick={() => setActiveGenre(tab.value)}
                        className={[
                            'px-6 py-2.5 text-base font-semibold border-b-2 transition-colors whitespace-nowrap',
                            activeGenre === tab.value
                                ? 'border-[#FD002D] text-[#FD002D]'
                                : 'border-transparent text-gray-400 hover:text-gray-600',
                        ].join(' ')}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 랭킹 목록 */}
            {rankLoading ? (
                <div className="py-8"><LoadingSpinner /></div>
            ) : rankEvents.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                    현재 예매 중인 공연이 없습니다.
                </div>
            ) : (
                <div className="grid grid-cols-5 gap-4">
                    {rankEvents.map((event, idx) => (
                        <button
                            key={event.eventId}
                            onClick={() => onEventClick(event.eventId)}
                            className="w-full text-left group focus:outline-none"
                            aria-label={`${idx + 1}위 ${event.title}`}
                        >
                            {/* 썸네일 */}
                            <div className="relative mb-2 overflow-hidden rounded-xl bg-gray-100" style={{ aspectRatio: '2/3' }}>
                                {event.thumbnailUrl ? (
                                    <img
                                        src={event.thumbnailUrl}
                                        alt={event.title}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                    </div>
                                )}
                                {/* 순위 배지 */}
                                <div className={[
                                    'absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shadow',
                                    idx === 0 ? 'bg-yellow-400 text-white' :
                                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                                            idx === 2 ? 'bg-amber-600 text-white' :
                                                'bg-white/80 text-gray-600',
                                ].join(' ')}>
                                    {idx + 1}
                                </div>
                            </div>
                            {/* 텍스트 정보 */}
                            <p className="text-xs text-gray-400 truncate">{event.venueName}</p>
                            <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#FD002D] transition-colors leading-snug">
                                {event.title}
                            </p>
                            <p className="mt-1 text-xs font-bold text-[#FD002D]">{formatPrice(event.minPrice)}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* 전체보기 버튼 */}
            {!rankLoading && rankEvents.length > 0 && (
                <div className="flex justify-center pt-6 pb-2">
                    <button
                        onClick={() => navigate(`/ticket/${activeGenre.toLowerCase()}`)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:border-[#FD002D] hover:text-[#FD002D] transition-colors"
                    >
                        {activeLabel} 전체보기
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </section>
    )
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────

function PopularKeywordsCard({
                                 keywords,
                                 loading,
                                 onKeywordClick,
                             }: {
    keywords: PopularKeyword[]
    loading: boolean
    onKeywordClick: (keyword: string) => void
}) {
    return (
        <section aria-label="인기 검색어" className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800">
                <span aria-hidden="true">🔥</span> 인기 검색어
            </h2>
            {loading ? (
                <LoadingSpinner size="small" />
            ) : keywords.length === 0 ? (
                <p className="text-xs text-gray-400">인기 검색어가 없습니다.</p>
            ) : (
                <ol className="space-y-1.5">
                    {keywords.map((kw) => (
                        <li key={kw.rank}>
                            <button
                                onClick={() => onKeywordClick(kw.keyword)}
                                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-sm hover:bg-gray-50 transition-colors"
                            >
                                <span className={[
                                    'w-5 shrink-0 text-center text-xs font-bold',
                                    kw.rank <= 3 ? 'text-[#FD002D]' : 'text-gray-400',
                                ].join(' ')}>
                                    {kw.rank}
                                </span>
                                <span className="flex-1 truncate text-gray-700">{kw.keyword}</span>
                            </button>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    )
}

function EventCard({ event, onClick }: { event: EventSummary; onClick: () => void }) {
    // 백엔드에서 보낸 eventStatus를 그대로 사용
    const cardStatus = event.eventStatus
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

function HomePage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { isLoggedIn, user } = useAuth()
    const isAdmin = user?.role === 'ADMIN'

    const [events, setEvents]               = useState<EventSummary[]>([])
    const [totalPages, setTotalPages]       = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [currentPage, setCurrentPage]     = useState(0)
    const [eventsLoading, setEventsLoading] = useState(true)

    const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'ALL'>(
        () => (searchParams.get('category') as EventCategory) || 'ALL'
    )
    const [selectedSort, setSelectedSort]     = useState('createdAt,desc')
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | EventStatus>('ON_SALE')

    const [popularKeywords, setPopularKeywords] = useState<PopularKeyword[]>([])
    const [keywordsLoading, setKeywordsLoading] = useState(true)

    useEffect(() => {
        const cat = (searchParams.get('category') as EventCategory) || 'ALL'
        setSelectedCategory((prev) => {
            if (prev === cat) return prev
            setCurrentPage(0)
            return cat
        })

        const statusParam = searchParams.get('status') as EventStatus | null
        if (statusParam) {
            setSelectedStatus((prev) => {
                if (prev === statusParam) return prev
                setCurrentPage(0)
                return statusParam
            })
        }
    }, [searchParams])

    useEffect(() => {
        const fetchEvents = async () => {
            setEventsLoading(true)
            try {
                const res = await getEvents({
                    page: currentPage,
                    size: 9,
                    sort: selectedSort,
                    ...(selectedCategory !== 'ALL' && { category: selectedCategory }),
                    ...(selectedStatus !== 'ALL' && { status: selectedStatus }),
                })

                // 백엔드에서 이미 status 파라미터로 필터링된 데이터를 받음
                // 추가 필터링 없이 그대로 사용
                setEvents(res.content ?? [])
                setTotalPages(res.totalPages ?? 0)
                setTotalElements(res.totalElements ?? 0)
            } catch {
                setEvents([])
                setTotalElements(0)
            } finally {
                setEventsLoading(false)
            }
        }
        fetchEvents()
    }, [currentPage, selectedCategory, selectedSort, selectedStatus])

    useEffect(() => {
        getPopularKeywords()
            .then(setPopularKeywords)
            .catch(() => setPopularKeywords([]))
            .finally(() => setKeywordsLoading(false))
    }, [])

    const handleCategoryChange = (category: EventCategory | 'ALL') => {
        setSelectedCategory(category)
        setCurrentPage(0)
    }
    const handleSortChange = (sort: string) => {
        setSelectedSort(sort)
        setCurrentPage(0)
    }
    const handleStatusChange = (status: 'ALL' | EventStatus) => {
        setSelectedStatus(status)
        setCurrentPage(0)
    }
    const handleSearch = (keyword: string) => {
        if (!keyword) return
        navigate(`/search?keyword=${encodeURIComponent(keyword)}`)
    }
    const handleKeywordClick = async (keyword: string) => {
        if (isLoggedIn) {
            try { await clickPopularKeyword(keyword) } catch { /* ignore */ }
        }
        navigate(`/search?keyword=${encodeURIComponent(keyword)}`)
    }

    return (
        <div className="space-y-8">

            <CarouselBanner onBookingClick={() => navigate('/?status=ON_SALE')} />

            {/* 장르별 랭킹 */}
            <GenreRanking onEventClick={(id) => navigate(`/events/${id}`)} />

            <div className="md:hidden">
                <SearchBar onSearch={handleSearch} />
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1 min-w-0">

                    {/* 상태 탭 */}
                    <div className="mb-3 flex gap-1 border-b border-gray-200" role="tablist" aria-label="예매 상태 필터">
                        {(isAdmin ? ADMIN_STATUS_TABS : STATUS_TABS).map((tab) => (
                            <button
                                key={tab.value}
                                role="tab"
                                aria-selected={selectedStatus === tab.value}
                                onClick={() => handleStatusChange(tab.value)}
                                className={[
                                    'px-4 py-2 text-sm font-semibold border-b-2 transition-colors',
                                    selectedStatus === tab.value
                                        ? 'border-[#FD002D] text-[#FD002D]'
                                        : 'border-transparent text-gray-400 hover:text-gray-600',
                                ].join(' ')}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* 카테고리 필터 */}
                    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="카테고리 필터">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => handleCategoryChange(cat.value)}
                                aria-pressed={selectedCategory === cat.value}
                                className={[
                                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                                    selectedCategory === cat.value
                                        ? 'bg-[#FD002D] text-white'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-[#FD002D] hover:text-[#FD002D]',
                                ].join(' ')}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* 정렬 + 결과 수 */}
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {eventsLoading ? '조회 중...' : `총 ${totalElements}개`}
                        </p>
                        <select
                            value={selectedSort}
                            onChange={(e) => handleSortChange(e.target.value)}
                            aria-label="정렬 기준"
                            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FD002D]"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* 이벤트 카드 목록 */}
                    {eventsLoading ? (
                        <LoadingSpinner />
                    ) : events.length === 0 ? (
                        <EmptyState
                            title="공연이 없습니다"
                            description="다른 카테고리를 선택하거나 검색을 이용해보세요"
                            actionLabel="전체 보기"
                            onAction={() => handleCategoryChange('ALL')}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {events.map((event) => (
                                <EventCard
                                    key={event.eventId}
                                    event={event}
                                    onClick={() => navigate(`/events/${event.eventId}`)}
                                />
                            ))}
                        </div>
                    )}

                    {!eventsLoading && totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                <aside className="w-full lg:w-64 shrink-0 space-y-4 lg:mt-36">
                    <PopularKeywordsCard
                        keywords={popularKeywords}
                        loading={keywordsLoading}
                        onKeywordClick={handleKeywordClick}
                    />
                </aside>
            </div>
        </div>
    )
}

export default HomePage