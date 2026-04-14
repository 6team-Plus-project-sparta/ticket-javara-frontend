/**
 * EventDetailPage — 이벤트 상세 화면 (SCR-005)
 *
 * 구성 요소:
 * 1. 브레드크럼
 * 2. 썸네일 + 기본 정보 (공연명, 카테고리, 일시, 장소, 예매 기간, 상태)
 * 3. 구역 정보 카드 목록 (잔여석 시각화)
 * 4. 이벤트 설명
 * 5. 우측 고정 패널 (최저가 + 좌석 선택 버튼)
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEventDetail } from '@/api/events'
import type { EventDetail, EventCategory, EventSection } from '@/types/event'
import { LoadingSpinner, StatusBadge, Button } from '@/components'
import { useAuth } from '@/contexts/AuthContext'

// ─── 유틸 ────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'long', hour: '2-digit', minute: '2-digit',
  })

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`

/** 카테고리 코드 → 한국어 */
const CATEGORY_LABEL: Record<EventCategory, string> = {
  CONCERT:    '콘서트',
  MUSICAL:    '뮤지컬/연극',
  SPORTS:     '스포츠',
  EXHIBITION: '전시',
  ETC:        '기타',
}

/**
 * 이벤트 상태 계산
 * - API 명세에 status 필드가 없으므로 saleStartAt/saleEndAt/eventDate로 추론
 */
function resolveEventStatus(event: EventDetail): 'ON_SALE' | 'SOLD_OUT' | 'ENDED' {
  const totalRemaining = event.sections.reduce((sum, s) => sum + s.remainingSeats, 0)
  if (totalRemaining === 0) return 'SOLD_OUT'

  const now = Date.now()
  if (event.saleEndAt && new Date(event.saleEndAt).getTime() < now) return 'ENDED'
  return 'ON_SALE'
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────

/** 브레드크럼 */
function Breadcrumb({ category, title }: { category: EventCategory; title: string }) {
  return (
    <nav aria-label="브레드크럼" className="mb-4 flex items-center gap-1.5 text-sm text-gray-400">
      <Link to="/" className="hover:text-blue-600 transition-colors">홈</Link>
      <span aria-hidden="true">›</span>
      <Link
        to={`/events?category=${category}`}
        className="hover:text-blue-600 transition-colors"
      >
        {CATEGORY_LABEL[category]}
      </Link>
      <span aria-hidden="true">›</span>
      <span className="truncate max-w-xs text-gray-600">{title}</span>
    </nav>
  )
}

/** 정보 행 — 라벨 + 값 */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-24 shrink-0 font-medium text-gray-500">{label}</span>
      <span className="text-gray-800">{children}</span>
    </div>
  )
}

/** 구역 카드 — 잔여석 비율 바 포함 */
function SectionCard({ section }: { section: EventSection }) {
  const ratio = section.totalSeats > 0
    ? section.remainingSeats / section.totalSeats
    : 0
  const percent = Math.round(ratio * 100)

  // 잔여석 비율에 따라 색상 변경
  const barColor =
    percent === 0   ? 'bg-gray-300' :
    percent <= 20   ? 'bg-red-500'  :
    percent <= 50   ? 'bg-yellow-400' :
                      'bg-blue-500'

  const statusText =
    section.remainingSeats === 0 ? '매진' :
    percent <= 20               ? '마감 임박' :
                                  '예매 가능'

  const statusColor =
    section.remainingSeats === 0 ? 'text-gray-400' :
    percent <= 20               ? 'text-red-500'  :
                                  'text-blue-600'

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900">{section.sectionName}</span>
        <span className={['text-xs font-medium', statusColor].join(' ')}>{statusText}</span>
      </div>

      {/* 잔여석 비율 바 */}
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
        <div
          className={['h-full rounded-full transition-all', barColor].join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          잔여{' '}
          <span className="font-semibold text-gray-800">
            {section.remainingSeats.toLocaleString()}
          </span>
          {' '}/{' '}
          {section.totalSeats.toLocaleString()}석
        </span>
        <span className="font-bold text-blue-600">{formatPrice(section.price)}</span>
      </div>
    </div>
  )
}

/** 우측 고정 예매 패널 */
function BookingPanel({
  eventId,
  minPrice,
  status,
  isLoggedIn,
}: {
  eventId: number
  minPrice: number
  status: 'ON_SALE' | 'SOLD_OUT' | 'ENDED'
  isLoggedIn: boolean
}) {
  const navigate = useNavigate()
  const canBook = isLoggedIn && status === 'ON_SALE'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
      {/* 최저가 */}
      <p className="mb-1 text-xs text-gray-400">최저가</p>
      <p className="mb-4 text-2xl font-extrabold text-blue-600">
        {formatPrice(minPrice)}
        <span className="text-sm font-normal text-gray-400">~</span>
      </p>

      {/* 좌석 선택 버튼 */}
      <Button
        size="large"
        className="w-full"
        disabled={!canBook}
        variant={status === 'ON_SALE' ? 'primary' : 'secondary'}
        onClick={() => navigate(`/events/${eventId}/seats`)}
      >
        {status === 'SOLD_OUT' ? '매진' :
         status === 'ENDED'   ? '예매 종료' :
                                '좌석 선택하기'}
      </Button>

      {/* 비로그인 안내 */}
      {!isLoggedIn && status === 'ON_SALE' && (
        <p className="mt-3 text-center text-xs text-gray-400">
          <Link to="/login" className="text-blue-500 hover:underline">로그인</Link>
          {' '}후 예매 가능합니다
        </p>
      )}
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { isLoggedIn } = useAuth()

  const [event, setEvent]     = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    getEventDetail(Number(eventId))
      .then(setEvent)
      .catch(() => setError('이벤트 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) return <LoadingSpinner />

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500">{error || '이벤트를 찾을 수 없습니다.'}</p>
        <Link to="/">
          <Button variant="secondary">홈으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  const status  = resolveEventStatus(event)
  const minPrice = Math.min(...event.sections.map((s) => s.price))
  const totalRemaining = event.sections.reduce((sum, s) => sum + s.remainingSeats, 0)

  return (
    <div>
      <Breadcrumb category={event.category} title={event.title} />

      {/* 메인 레이아웃 — 좌측 콘텐츠 + 우측 고정 패널 */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

        {/* ── 좌측 콘텐츠 ── */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* 썸네일 + 기본 정보 */}
          <section className="flex flex-col gap-6 sm:flex-row">
            {/* 썸네일 */}
            <div className="h-64 w-full overflow-hidden rounded-xl bg-gray-100 sm:h-72 sm:w-56 shrink-0">
              {event.thumbnailUrl ? (
                <img
                  src={event.thumbnailUrl}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              )}
            </div>

            {/* 기본 정보 */}
            <div className="flex flex-col gap-3">
              {/* 카테고리 배지 + 상태 배지 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-600">
                  {CATEGORY_LABEL[event.category]}
                </span>
                <StatusBadge status={status} />
              </div>

              {/* 공연명 */}
              <h1 className="text-xl font-extrabold leading-snug text-gray-900 sm:text-2xl">
                {event.title}
              </h1>

              <div className="space-y-2">
                {/* 회차 */}
                {event.roundNumber && (
                  <InfoRow label="회차">{event.roundNumber}회차</InfoRow>
                )}
                {/* 공연 일시 */}
                <InfoRow label="공연 일시">{formatDate(event.eventDate)}</InfoRow>
                {/* 장소 */}
                <InfoRow label="장소">
                  <span>
                    {event.venue.name}
                    <span className="ml-1 text-gray-400">({event.venue.address})</span>
                  </span>
                </InfoRow>
                {/* 예매 오픈 */}
                {event.saleStartAt && (
                  <InfoRow label="예매 오픈">{formatDate(event.saleStartAt)}</InfoRow>
                )}
                {/* 예매 마감 */}
                {event.saleEndAt && (
                  <InfoRow label="예매 마감">{formatDate(event.saleEndAt)}</InfoRow>
                )}
                {/* 잔여석 합계 */}
                <InfoRow label="잔여석">
                  <span className={totalRemaining === 0 ? 'text-gray-400' : 'font-semibold text-blue-600'}>
                    {totalRemaining.toLocaleString()}석
                  </span>
                </InfoRow>
              </div>
            </div>
          </section>

          {/* 구역 정보 */}
          <section aria-labelledby="section-heading">
            <h2 id="section-heading" className="mb-4 text-base font-bold text-gray-900">
              구역 정보
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {event.sections.map((section) => (
                <SectionCard key={section.sectionId} section={section} />
              ))}
            </div>
          </section>

          {/* 이벤트 설명 */}
          {event.description && (
            <section aria-labelledby="desc-heading">
              <h2 id="desc-heading" className="mb-3 text-base font-bold text-gray-900">
                공연 소개
              </h2>
              <div className="rounded-xl border border-gray-100 bg-white p-5 text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {event.description}
              </div>
            </section>
          )}

          {/* 모바일용 예매 패널 (lg 미만에서만 표시) */}
          <div className="lg:hidden">
            <BookingPanel
              eventId={event.eventId}
              minPrice={minPrice}
              status={status}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </div>

        {/* ── 우측 고정 패널 (lg 이상에서만 표시) ── */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
          <BookingPanel
            eventId={event.eventId}
            minPrice={minPrice}
            status={status}
            isLoggedIn={isLoggedIn}
          />
        </aside>

      </div>
    </div>
  )
}

export default EventDetailPage
