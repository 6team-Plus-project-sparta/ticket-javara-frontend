/**
 * SearchResultPage — 검색 결과 화면 (SCR-004)
 *
 * 구성 요소:
 * 1. 상단 검색창 (URL 쿼리스트링과 동기화)
 * 2. 필터 패널 (카테고리, 날짜, 가격)
 * 3. 결과 헤더 (결과 수, 정렬, X-Cache 배지)
 * 4. 이벤트 카드 리스트
 * 5. 페이지네이션
 * 6. 인기 검색어 사이드바
 *
 * URL 구조 예시:
 *   /search?keyword=세븐틴&category=CONCERT&sort=eventDate,asc&page=0
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { searchEventsV1, searchEventsV2 } from '@/api/events'
import { getPopularKeywords, clickPopularKeyword } from '@/api/search'
import type { EventSummary, EventCategory } from '@/types/event'
import type { PopularKeyword } from '@/types/search'
import type { PageResponse } from '@/types/common'
import {
  SearchBar,
  LoadingSpinner,
  EmptyState,
  Pagination,
  StatusBadge,
} from '@/components'
import { useAuth } from '@/contexts/AuthContext'

// ─── 개발용 API 버전 토글 ─────────────────────────────────────
// 'v1' | 'v2' 로 바꿔서 두 버전을 쉽게 비교 테스트할 수 있다
const SEARCH_API_VERSION: 'v1' | 'v2' = 'v2'

// ─── 상수 ────────────────────────────────────────────────────

const CATEGORIES: { label: string; value: EventCategory | '' }[] = [
  { label: '전체',   value: '' },
  { label: '콘서트', value: 'CONCERT' },
  { label: '뮤지컬', value: 'MUSICAL' },
  { label: '스포츠', value: 'SPORTS' },
  { label: '전시',   value: 'EXHIBITION' },
  { label: '기타',   value: 'ETC' },
]

const SORT_OPTIONS = [
  { label: '공연일 빠른 순', value: 'eventDate,asc' },
  { label: '공연일 늦은 순', value: 'eventDate,desc' },
  { label: '낮은 가격 순',   value: 'minPrice,asc' },
  { label: '높은 가격 순',   value: 'minPrice,desc' },
]

// ─── 타입 ────────────────────────────────────────────────────

/** URL 쿼리스트링과 동기화되는 검색 필터 상태 */
interface SearchFilters {
  keyword: string
  category: EventCategory | ''
  startDate: string
  endDate: string
  minPrice: string
  maxPrice: string
  sort: string
  page: number
}

// ─── 유틸 ────────────────────────────────────────────────────

const formatEventDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  })

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원~`

/** URLSearchParams → SearchFilters 변환 */
const paramsToFilters = (params: URLSearchParams): SearchFilters => ({
  keyword:   params.get('keyword')   ?? '',
  category:  (params.get('category') ?? '') as EventCategory | '',
  startDate: params.get('startDate') ?? '',
  endDate:   params.get('endDate')   ?? '',
  minPrice:  params.get('minPrice')  ?? '',
  maxPrice:  params.get('maxPrice')  ?? '',
  sort:      params.get('sort')      ?? 'eventDate,asc',
  page:      Number(params.get('page') ?? '0'),
})

/** SearchFilters → URLSearchParams 변환 (빈 값은 제외) */
const filtersToParams = (filters: SearchFilters): Record<string, string> => {
  const entries: Record<string, string> = {}
  if (filters.keyword)   entries.keyword   = filters.keyword
  if (filters.category)  entries.category  = filters.category
  if (filters.startDate) entries.startDate = filters.startDate
  if (filters.endDate)   entries.endDate   = filters.endDate
  if (filters.minPrice)  entries.minPrice  = filters.minPrice
  if (filters.maxPrice)  entries.maxPrice  = filters.maxPrice
  if (filters.sort)      entries.sort      = filters.sort
  if (filters.page > 0)  entries.page      = String(filters.page)
  return entries
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────

/** X-Cache 상태 배지 (v2 전용) */
function CacheBadge({ status }: { status: 'HIT' | 'MISS' | null }) {
  if (!status) return null
  return (
    <span
      title="X-Cache 응답 헤더 값"
      className={[
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-semibold',
        status === 'HIT'
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700',
      ].join(' ')}
    >
      X-Cache: {status}
    </span>
  )
}

/** 필터 패널 */
function FilterPanel({
  filters,
  onChange,
  onReset,
}: {
  filters: SearchFilters
  onChange: (partial: Partial<SearchFilters>) => void
  onReset: () => void
}) {
  return (
    <aside className="w-full rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:w-56 shrink-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">필터</h2>
        <button
          onClick={onReset}
          className="text-xs text-blue-500 hover:underline"
        >
          초기화
        </button>
      </div>

      {/* 카테고리 */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">카테고리</p>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((cat) => (
            <label key={cat.value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={filters.category === cat.value}
                onChange={() => onChange({ category: cat.value, page: 0 })}
                className="accent-blue-600"
              />
              {cat.label}
            </label>
          ))}
        </div>
      </div>

      {/* 공연 날짜 */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">공연 날짜</p>
        <div className="flex flex-col gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onChange({ startDate: e.target.value, page: 0 })}
            aria-label="시작 날짜"
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-center text-xs text-gray-400">~</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onChange({ endDate: e.target.value, page: 0 })}
            aria-label="종료 날짜"
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 가격 범위 */}
      <div>
        <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">가격 범위</p>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value, page: 0 })}
            placeholder="최소"
            min={0}
            aria-label="최소 가격"
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="shrink-0 text-xs text-gray-400">~</span>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value, page: 0 })}
            placeholder="최대"
            min={0}
            aria-label="최대 가격"
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </aside>
  )
}

/** 인기 검색어 위젯 */
function PopularKeywordsWidget({
  keywords,
  loading,
  onKeywordClick,
}: {
  keywords: PopularKeyword[]
  loading: boolean
  onKeywordClick: (keyword: string) => void
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800">
        <span aria-hidden="true">🔥</span> 인기 검색어
      </h2>
      {loading ? (
        <LoadingSpinner size="small" />
      ) : keywords.length === 0 ? (
        <p className="text-xs text-gray-400">데이터가 없습니다.</p>
      ) : (
        <ol className="space-y-1">
          {keywords.map((kw) => (
            <li key={kw.rank}>
              <button
                onClick={() => onKeywordClick(kw.keyword)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-sm hover:bg-gray-50 transition-colors"
              >
                <span className={['w-5 shrink-0 text-center text-xs font-bold', kw.rank <= 3 ? 'text-blue-600' : 'text-gray-400'].join(' ')}>
                  {kw.rank}
                </span>
                <span className="flex-1 truncate text-gray-700">{kw.keyword}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** 이벤트 카드 (검색 결과용 — 가로형) */
function EventResultCard({ event, onClick }: { event: EventSummary; onClick: () => void }) {
  const isSoldOut = event.remainingSeats === 0
  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`${event.title} 상세 보기`}
      className="group flex cursor-pointer gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 썸네일 */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-28 sm:w-28">
        {event.thumbnailUrl ? (
          <img src={event.thumbnailUrl} alt={event.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-xs font-bold text-white">매진</span>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <StatusBadge status={isSoldOut ? 'SOLD_OUT' : 'ON_SALE'} />
            <span className="text-xs text-gray-400">{event.venueName}</span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500">{formatEventDate(event.eventDate)}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-blue-600">{formatPrice(event.minPrice)}</span>
          <span className="text-xs text-gray-400">잔여 {event.remainingSeats.toLocaleString()}석</span>
        </div>
      </div>
    </article>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function SearchResultPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isLoggedIn } = useAuth()

  /** 쿼리스트링만 단일 소스로 사용 (로컬 state와 URL 이중 동기화 시 역주입/레이스 방지) */
  const queryKey = searchParams.toString()
  const filters = useMemo(
    () => paramsToFilters(new URLSearchParams(queryKey)),
    [queryKey],
  )

  // 검색 결과 상태
  const [results, setResults] = useState<EventSummary[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)

  // X-Cache 헤더 상태 (v2 전용)
  const [cacheStatus, setCacheStatus] = useState<'HIT' | 'MISS' | null>(null)

  // 인기 검색어 상태
  const [popularKeywords, setPopularKeywords] = useState<PopularKeyword[]>([])
  const [keywordsLoading, setKeywordsLoading] = useState(true)

  // 필터 변경 → URL만 갱신 (함수형 업데이트로 항상 최신 쿼리 기준 병합)
  const updateFilters = useCallback((partial: Partial<SearchFilters>) => {
    setSearchParams(
      (prev) => {
        const next = { ...paramsToFilters(prev), ...partial }
        return filtersToParams(next)
      },
      { replace: true },
    )
  }, [setSearchParams])

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const current = paramsToFilters(prev)
        const reset: SearchFilters = {
          keyword: current.keyword,
          category: '', startDate: '', endDate: '',
          minPrice: '', maxPrice: '', sort: 'eventDate,asc', page: 0,
        }
        return filtersToParams(reset)
      },
      { replace: true },
    )
  }, [setSearchParams])

  // 검색 실행 (필터가 바뀔 때마다 이전 in-flight 요청은 abort — 늦게 도착한 응답이 목록을 덮어쓰는 현상 방지)
  useEffect(() => {
    const f = paramsToFilters(new URLSearchParams(queryKey))
    if (!f.keyword.trim()) {
      setResults([])
      setTotalElements(0)
      setTotalPages(0)
      setCacheStatus(null)
      setLoading(false)
      return
    }

    const ac = new AbortController()
    let stale = false

    const fetchResults = async () => {
      setLoading(true)
      setCacheStatus(null)
      const reqOpts = { signal: ac.signal }
      try {
        const params = {
          keyword:   f.keyword,
          ...(f.category  && { category: f.category }),
          ...(f.startDate && { startDate: f.startDate }),
          ...(f.endDate   && { endDate: f.endDate }),
          ...(f.minPrice  && { minPrice: Number(f.minPrice) }),
          ...(f.maxPrice  && { maxPrice: Number(f.maxPrice) }),
          sort: f.sort,
          page: f.page,
          size: 10,
        }

        let pageData: PageResponse<EventSummary>

        if (SEARCH_API_VERSION === 'v2') {
          const res = await searchEventsV2(params, reqOpts)
          if (stale) return
          pageData = res.data
          setCacheStatus(res.cacheStatus)
        } else {
          pageData = await searchEventsV1(params, reqOpts)
          if (stale) return
        }

        setResults(pageData.content ?? [])
        setTotalPages(pageData.totalPages ?? 0)
        setTotalElements(pageData.totalElements ?? 0)
      } catch (e) {
        if (stale) return
        if (axios.isAxiosError(e) && e.code === 'ERR_CANCELED') return
        setResults([])
        setTotalPages(0)
        setTotalElements(0)
      } finally {
        if (!stale) setLoading(false)
      }
    }

    void fetchResults()

    return () => {
      stale = true
      ac.abort()
    }
  }, [queryKey])

  // 인기 검색어 조회 (최초 1회)
  useEffect(() => {
    getPopularKeywords()
      .then(setPopularKeywords)
      .catch(() => setPopularKeywords([]))
      .finally(() => setKeywordsLoading(false))
  }, [])

  // 검색창에서 새 키워드 검색
  const handleSearch = (keyword: string) => {
    updateFilters({ keyword, page: 0 })
  }

  // 인기 검색어 클릭
  const handleKeywordClick = async (keyword: string) => {
    if (isLoggedIn) {
      try { await clickPopularKeyword(keyword) } catch { /* 실패해도 검색 진행 */ }
    }
    updateFilters({ keyword, page: 0 })
  }

  return (
    <div className="space-y-6">

      {/* 상단 검색창 */}
      <div className="flex flex-col gap-2">
        <SearchBar
          onSearch={handleSearch}
          defaultValue={filters.keyword}
          key={filters.keyword} // keyword 바뀌면 SearchBar 내부 상태 초기화
        />
        {/* 현재 API 버전 표시 (개발용) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            검색 API: <span className="font-mono font-semibold text-gray-600">{SEARCH_API_VERSION.toUpperCase()}</span>
          </span>
          {SEARCH_API_VERSION === 'v2' && <CacheBadge status={cacheStatus} />}
        </div>
      </div>

      {/* 메인 레이아웃 */}
      <div className="flex flex-col gap-6 lg:flex-row">

        {/* 왼쪽: 필터 패널 */}
        <FilterPanel filters={filters} onChange={updateFilters} onReset={resetFilters} />

        {/* 가운데: 검색 결과 */}
        <div className="flex-1 min-w-0">

          {/* 결과 헤더 */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filters.keyword ? (
                <>
                  <span className="font-semibold text-gray-900">"{filters.keyword}"</span>
                  {' '}검색 결과{' '}
                  {!loading && (
                    <span className="text-blue-600 font-semibold">{totalElements.toLocaleString()}건</span>
                  )}
                </>
              ) : (
                '검색어를 입력해주세요'
              )}
            </p>
            {/* 정렬 */}
            {results.length > 0 && (
              <select
                value={filters.sort}
                onChange={(e) => updateFilters({ sort: e.target.value, page: 0 })}
                aria-label="정렬 기준"
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* 결과 목록 */}
          {loading ? (
            <LoadingSpinner />
          ) : !filters.keyword.trim() ? (
            <EmptyState
              title="검색어를 입력해주세요"
              description="공연명, 아티스트, 장소로 검색할 수 있어요"
            />
          ) : results.length === 0 ? (
            <EmptyState
              title={`"${filters.keyword}" 검색 결과가 없습니다`}
              description="다른 검색어나 필터를 사용해보세요"
              actionLabel="필터 초기화"
              onAction={resetFilters}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((event) => (
                <EventResultCard
                  key={event.eventId}
                  event={event}
                  onClick={() => navigate(`/events/${event.eventId}`)}
                />
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {!loading && totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={filters.page}
                totalPages={totalPages}
                onPageChange={(page) => updateFilters({ page })}
              />
            </div>
          )}
        </div>

        {/* 오른쪽: 인기 검색어 사이드바 */}
        <aside className="w-full lg:w-56 shrink-0">
          <PopularKeywordsWidget
            keywords={popularKeywords}
            loading={keywordsLoading}
            onKeywordClick={handleKeywordClick}
          />
        </aside>

      </div>
    </div>
  )
}

export default SearchResultPage
