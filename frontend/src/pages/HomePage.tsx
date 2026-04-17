/**
 * HomePage — 메인 홈 화면 (SCR-003)
 *
 * 구성 요소:
 * 1. 히어로 배너
 * 2. 인기 검색어
 * 3. 카테고리 + 정렬 필터
 * 4. 이벤트 카드 목록 (3열 그리드)
 * 5. 페이지네이션
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getEvents } from '@/api/events'
import { getPopularKeywords, clickPopularKeyword } from '@/api/search'
import type { EventSummary, EventCategory } from '@/types/event'
import type { PopularKeyword } from '@/types/search'
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
  { label: '전체',     value: 'ALL' },
  { label: '콘서트',   value: 'CONCERT' },
  { label: '뮤지컬',   value: 'MUSICAL' },
  { label: '스포츠',   value: 'SPORTS' },
  { label: '전시',     value: 'EXHIBITION' },
  { label: '기타',     value: 'ETC' },
]

const STATUS_TABS: { label: string; value: 'ALL' | 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED' | 'ENDED' }[] = [
  { label: '전체',   value: 'ALL' },
  { label: '예매중', value: 'ON_SALE' },
  { label: '매진',   value: 'SOLD_OUT' },
]

const SORT_OPTIONS = [
  { label: '최신 등록순',     value: 'createdAt,desc' },
  { label: '공연일 빠른 순', value: 'eventDate,asc' },
  { label: '공연일 늦은 순', value: 'eventDate,desc' },
  { label: '낮은 가격 순',   value: 'minPrice,asc' },
  { label: '높은 가격 순',   value: 'minPrice,desc' },
]

// ─── 유틸 ────────────────────────────────────────────────────

/** 날짜 문자열을 "2026.05.10 (일) 18:00" 형식으로 변환 */
const formatEventDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  })
}

/** 숫자를 "110,000원~" 형식으로 변환 */
const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원~`

// ─── 서브 컴포넌트 ────────────────────────────────────────────

/** 히어로 배너 */
function HeroBanner({ onBookingClick }: { onBookingClick: () => void }) {
  return (
    <section
      aria-label="히어로 배너"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-8 py-14 text-white shadow-lg"
    >
      {/* 배경 장식 원 */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
      <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5" aria-hidden="true" />

      <div className="relative z-10 max-w-xl">
        <p className="mb-2 text-sm font-medium text-blue-200 uppercase tracking-widest">지금 바로 예매하세요</p>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight md:text-4xl">
          설레는 순간을<br />티켓을 JAVA라와 함께
        </h1>
        <p className="mb-6 text-blue-100 text-sm md:text-base">
          콘서트, 뮤지컬, 스포츠까지 — 모든 공연 티켓을 한 곳에서
        </p>
        <button
          onClick={onBookingClick}
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-blue-700 shadow hover:bg-blue-50 transition-colors"
        >
          지금 예매하기
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}

/** 인기 검색어 카드 */
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
                {/* 순위 번호 — 1~3위는 파란색 강조 */}
                <span className={[
                  'w-5 shrink-0 text-center text-xs font-bold',
                  kw.rank <= 3 ? 'text-blue-600' : 'text-gray-400',
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

/** 이벤트 카드 */
function EventCard({ event, onClick }: { event: EventSummary; onClick: () => void }) {
  // 백엔드 status 우선, 없으면 remainingSeats로 판단
  const resolvedStatus = event.status ?? (event.remainingSeats === 0 ? 'SOLD_OUT' : 'ON_SALE')
  const isSoldOut = resolvedStatus === 'SOLD_OUT'
  const isEnded   = resolvedStatus === 'ENDED' || resolvedStatus === 'CANCELLED'

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`${event.title} 상세 보기`}
      className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 썸네일 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {event.thumbnailUrl ? (
          <img
            src={event.thumbnailUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* 썸네일 없을 때 플레이스홀더 */
          <div className="flex h-full items-center justify-center text-gray-300" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
        )}
        {/* 매진/종료 오버레이 */}
        {(isSoldOut || isEnded) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700">
              {isSoldOut ? '매진' : '종료됨'}
            </span>
          </div>
        )}
        {/* 상태 배지 */}
        <div className="absolute left-2 top-2">
          <StatusBadge status={resolvedStatus} />
        </div>
      </div>

      {/* 카드 본문 */}
      <div className="p-4">
        <p className="mb-1 text-xs text-gray-400">{event.venueName}</p>
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {event.title}
        </h3>
        <p className="mb-3 text-xs text-gray-500">{formatEventDate(event.eventDate)}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary-600">{formatPrice(event.minPrice)}</span>
          {/* 상태에 따라 잔여석 또는 예매종료 표시 */}
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
  const { isLoggedIn } = useAuth()

  // 이벤트 목록 상태
  const [events, setEvents] = useState<EventSummary[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [eventsLoading, setEventsLoading] = useState(true)

  // 필터 상태 — URL 쿼리스트링의 category를 초기값으로 사용
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'ALL'>(
    () => (searchParams.get('category') as EventCategory) || 'ALL'
  )
  const [selectedSort, setSelectedSort]     = useState('createdAt,desc')
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED' | 'ENDED'>('ALL')

  // 인기 검색어 상태
  const [popularKeywords, setPopularKeywords] = useState<PopularKeyword[]>([])
  const [keywordsLoading, setKeywordsLoading] = useState(true)

  // URL 쿼리스트링 category 변경 시 필터 동기화 (헤더 네비 클릭 대응)
  useEffect(() => {
    const cat = (searchParams.get('category') as EventCategory) || 'ALL'
    // 이미 같은 값이면 불필요한 재조회 방지
    setSelectedCategory((prev) => {
      if (prev === cat) return prev
      setCurrentPage(0)
      return cat
    })
  }, [searchParams])

  // 이벤트 목록 조회
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

        let content = res.content ?? []

        // ENDED / CANCELLED 이벤트는 항상 제외 (status 필드 기준)
        content = content.filter((e) =>
          e.status !== 'ENDED' &&
          e.status !== 'CANCELLED'
        )

        // 예매중 탭: 매진(remainingSeats=0 또는 status=SOLD_OUT) 제외
        if (selectedStatus === 'ON_SALE') {
          content = content.filter((e) => e.remainingSeats > 0 && e.status !== 'SOLD_OUT')
        }

        setEvents(content)
        setTotalPages(res.totalPages ?? 0)
      } catch {
        setEvents([])
      } finally {
        setEventsLoading(false)
      }
    }
    fetchEvents()
  }, [currentPage, selectedCategory, selectedSort, selectedStatus])

  // 인기 검색어 조회 (최초 1회)
  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const data = await getPopularKeywords()
        setPopularKeywords(data)
      } catch {
        setPopularKeywords([])
      } finally {
        setKeywordsLoading(false)
      }
    }
    fetchKeywords()
  }, [])

  // 카테고리/정렬/상태 변경 시 페이지 초기화
  const handleCategoryChange = (category: EventCategory | 'ALL') => {
    setSelectedCategory(category)
    setCurrentPage(0)
  }

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort)
    setCurrentPage(0)
  }

  const handleStatusChange = (status: 'ALL' | 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED' | 'ENDED') => {
    setSelectedStatus(status)
    setCurrentPage(0)
  }

  // 검색 실행
  const handleSearch = (keyword: string) => {
    if (!keyword) return
    navigate(`/search?keyword=${encodeURIComponent(keyword)}`)
  }

  // 인기 검색어 클릭
  const handleKeywordClick = async (keyword: string) => {
    // 로그인 상태일 때만 클릭 점수 반영 (API 명세: 인증 필수)
    if (isLoggedIn) {
      try { await clickPopularKeyword(keyword) } catch { /* 실패해도 검색은 진행 */ }
    }
    navigate(`/search?keyword=${encodeURIComponent(keyword)}`)
  }

  return (
    <div className="space-y-8">

      {/* 1. 히어로 배너 */}
      <HeroBanner onBookingClick={() => navigate('/events/1')} />

      {/* 2. 검색창 (모바일용 — Header의 SearchBar는 md 이상에서만 보임) */}
      <div className="md:hidden">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* 3. 메인 콘텐츠 영역 — 이벤트 목록 + 사이드바 */}
      <div className="flex flex-col gap-6 lg:flex-row">

        {/* 왼쪽: 이벤트 목록 */}
        <div className="flex-1 min-w-0">

          {/* 상태 탭 — 예매중 / 매진 */}
          <div className="mb-3 flex gap-1 border-b border-gray-200" role="tablist" aria-label="예매 상태 필터">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={selectedStatus === tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={[
                  'px-4 py-2 text-sm font-semibold border-b-2 transition-colors',
                  selectedStatus === tab.value
                    ? 'border-primary-500 text-primary-600'
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-600',
                ].join(' ')}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 정렬 필터 + 결과 수 */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {eventsLoading ? '조회 중...' : `총 ${events.length}개`}
            </p>
            <select
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value)}
              aria-label="정렬 기준"
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* 페이지네이션 */}
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

        {/* 오른쪽: 사이드바 (lg 이상에서만 표시) */}
        <aside className="w-full lg:w-64 shrink-0 space-y-4">
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
