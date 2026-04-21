/**
 * CarouselBanner — 홈 히어로 캐러셀 (SCR-003)
 *
 * - ON_SALE 공연 상위 5개 자동 슬라이드 (4초 간격)
 * - 좌/우 화살표 수동 이동
 * - 하단 인디케이터 도트
 * - 이미지 위 공연 제목·날짜·가격 오버레이
 * - 클릭 시 해당 공연 상세 페이지 이동
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEvents } from '@/api/events'
import type { EventSummary } from '@/types/event'

// ─── 유틸 ────────────────────────────────────────────────────

const formatSlideDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
    })
}

const formatSlidePrice = (price: number) =>
    `${price.toLocaleString('ko-KR')}원~`

// ─── 스켈레톤 ─────────────────────────────────────────────────

function BannerSkeleton() {
    return (
        <div
            className="relative overflow-hidden rounded-2xl bg-gray-200 animate-pulse"
            style={{ aspectRatio: '16/6', minHeight: '260px' }}
            aria-label="배너 로딩 중"
        >
            <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="h-6 w-2/5 rounded bg-gray-300 mb-3" />
                <div className="h-9 w-3/5 rounded bg-gray-300 mb-4" />
                <div className="h-4 w-1/4 rounded bg-gray-300" />
            </div>
        </div>
    )
}

// ─── 폴백 배너 (공연 없을 때) ──────────────────────────────────

function FallbackBanner({ onBookingClick }: { onBookingClick: () => void }) {
    return (
        <section
            aria-label="히어로 배너"
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-8 py-14 text-white shadow-lg"
            style={{ minHeight: '260px' }}
        >
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

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface CarouselBannerProps {
    /** 폴백용 — 공연 목록(예매중 탭)으로 이동 */
    onBookingClick: () => void
}

export default function CarouselBanner({ onBookingClick }: CarouselBannerProps) {
    const navigate = useNavigate()
    const [slides, setSlides] = useState<EventSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [current, setCurrent] = useState(0)
    const [paused, setPaused] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // ── ON_SALE 공연 상위 5개 로드 ────────────────────────────
    useEffect(() => {
        getEvents({ status: 'ON_SALE', sort: 'eventDate,asc', size: 5, page: 0 })
            .then((res) => setSlides(res.content ?? []))
            .catch(() => setSlides([]))
            .finally(() => setLoading(false))
    }, [])

    // ── 자동 슬라이드 (4초) ───────────────────────────────────
    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
            setCurrent((prev) => (prev + 1) % Math.max(slides.length, 1))
        }, 4000)
    }, [slides.length])

    useEffect(() => {
        if (slides.length <= 1 || paused) {
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }
        startTimer()
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [slides.length, paused, startTimer])

    // ── 수동 이동 ─────────────────────────────────────────────
    const goTo = (idx: number) => {
        setCurrent((idx + slides.length) % slides.length)
        if (!paused) startTimer() // 타이머 리셋
    }
    const goPrev = () => goTo(current - 1)
    const goNext = () => goTo(current + 1)

    // ─────────────────────────────────────────────────────────

    if (loading) return <BannerSkeleton />
    if (slides.length === 0) return <FallbackBanner onBookingClick={onBookingClick} />

    const slide = slides[current]

    return (
        <section
            aria-label="공연 캐러셀 배너"
            aria-roledescription="carousel"
            className="relative overflow-hidden rounded-2xl shadow-lg select-none"
            style={{ aspectRatio: '16/6', minHeight: '260px' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* ── 슬라이드 이미지 ── */}
            {slides.map((s, idx) => (
                <div
                    key={s.eventId}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${idx + 1} / ${slides.length}: ${s.title}`}
                    aria-hidden={idx !== current}
                    className={[
                        'absolute inset-0 transition-opacity duration-700',
                        idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0',
                    ].join(' ')}
                >
                    {s.thumbnailUrl ? (
                        <img
                            src={s.thumbnailUrl}
                            alt={s.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700" />
                    )}

                    {/* 어두운 그라디언트 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>
            ))}

            {/* ── 텍스트 오버레이 (클릭 가능) ── */}
            <button
                onClick={() => navigate(`/events/${slide.eventId}`)}
                className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-10 text-left w-full focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                aria-label={`${slide.title} 상세 보기`}
            >
                <p className="mb-1.5 text-xs font-semibold text-blue-300 uppercase tracking-widest drop-shadow">
                    지금 예매 중
                </p>
                <h2 className="mb-2 text-2xl font-extrabold leading-snug text-white drop-shadow-lg md:text-3xl line-clamp-2">
                    {slide.title}
                </h2>
                <p className="mb-1 text-sm text-white/80 drop-shadow">
                    📅 {formatSlideDate(slide.eventDate)}
                </p>
                <p className="text-base font-bold text-yellow-300 drop-shadow">
                    {formatSlidePrice(slide.minPrice)}
                </p>
            </button>

            {/* ── 좌/우 화살표 ── */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); goPrev() }}
                        aria-label="이전 슬라이드"
                        className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goNext() }}
                        aria-label="다음 슬라이드"
                        className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}

            {/* ── 하단 인디케이터 도트 ── */}
            {slides.length > 1 && (
                <div
                    role="tablist"
                    aria-label="슬라이드 선택"
                    className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2"
                >
                    {slides.map((s, idx) => (
                        <button
                            key={s.eventId}
                            role="tab"
                            aria-selected={idx === current}
                            aria-label={`슬라이드 ${idx + 1}로 이동`}
                            onClick={(e) => { e.stopPropagation(); goTo(idx) }}
                            className={[
                                'h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
                                idx === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75',
                            ].join(' ')}
                        />
                    ))}
                </div>
            )}

            {/* ── 현재 위치 카운터 (우상단) ── */}
            {slides.length > 1 && (
                <div className="absolute right-4 top-4 z-30 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm" aria-live="polite" aria-atomic="true">
                    {current + 1} / {slides.length}
                </div>
            )}
        </section>
    )
}
