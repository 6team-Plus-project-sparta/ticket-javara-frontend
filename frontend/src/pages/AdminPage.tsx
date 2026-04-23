/**
 * AdminPage — 관리자 대시보드
 *
 * 탭 구성:
 * - 이벤트 등록: POST /api/admin/events
 * - 쿠폰 등록:   POST /api/admin/coupons
 *
 * ADMIN 권한 사용자만 접근 가능 (ProtectedRoute + role 체크)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEvent, updateEventStatus, getEvents } from '@/api/events'
import { createCoupon, getCouponMetrics } from '@/api/coupons'
import type { EventCategory, CreateEventSectionInput, EventStatus, EventSummary, ALLOWED_STATUS_TRANSITIONS } from '@/types/event'
import { ALLOWED_STATUS_TRANSITIONS as STATUS_TRANSITIONS } from '@/types/event'
import type { CouponMetrics } from '@/types/coupon'
import type { AxiosError } from 'axios'
import { Button, Input, StatusBadge, LoadingSpinner } from '@/components'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'

// ─── 유틸 ────────────────────────────────────────────────────

const CATEGORIES: { label: string; value: EventCategory }[] = [
  { label: '콘서트',   value: 'CONCERT' },
  { label: '뮤지컬',   value: 'MUSICAL' },
  { label: '스포츠',   value: 'SPORTS' },
  { label: '전시',     value: 'DISPLAY' },
  { label: '기타',     value: 'ETC' },
]

function getErrorMessage(error: unknown): string {
  const msg = (error as AxiosError<{ message?: string; data?: { message?: string } }>)
    .response?.data
  return msg?.message ?? (msg as { data?: { message?: string } })?.data?.message ?? '오류가 발생했습니다.'
}

// ─── 이벤트 등록 폼 ──────────────────────────────────────────

function EventCreateForm() {
  const { toast }   = useToast()
  const navigate    = useNavigate()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title:       '',
    category:    'CONCERT' as EventCategory,
    venueId:     '',
    eventDate:   '',
    saleStartAt: '',
    saleEndAt:   '',
    roundNumber: '',
    description: '',
    thumbnailUrl: '',
  })

  // 구역 목록
  const [sections, setSections] = useState<CreateEventSectionInput[]>([
    { sectionName: '', price: 0, rowCount: 1, colCount: 1 },
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSectionChange = (idx: number, field: keyof CreateEventSectionInput, value: string | number) => {
    setSections((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const addSection = () =>
    setSections((prev) => [...prev, { sectionName: '', price: 0, rowCount: 1, colCount: 1 }])

  const removeSection = (idx: number) =>
    setSections((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sections.length === 0) { toast.error('구역을 1개 이상 추가해주세요.'); return }

    setLoading(true)
    try {
      const res = await createEvent({
        title:        form.title,
        category:     form.category,
        venueId:      Number(form.venueId),
        eventDate:    form.eventDate,
        saleStartAt:  form.saleStartAt,
        saleEndAt:    form.saleEndAt,
        roundNumber:  form.roundNumber ? Number(form.roundNumber) : undefined,
        description:  form.description || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        sections,
      })
      toast.success(`이벤트 등록 완료! (ID: ${res.eventId}, 총 ${res.totalSeats}석)`)
      navigate(`/events/${res.eventId}`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* 기본 정보 */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-700">기본 정보</h2>

        <Input label="공연명 *" name="title" value={form.title} onChange={handleChange} placeholder="세븐틴 콘서트 2026" required />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">카테고리 *</label>
          <select name="category" value={form.category} onChange={handleChange}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <Input label="공연장 ID *" name="venueId" type="number" value={form.venueId} onChange={handleChange} placeholder="1" required />
        <Input label="공연 일시 *" name="eventDate" type="datetime-local" value={form.eventDate} onChange={handleChange} required />
        <Input label="예매 오픈 *" name="saleStartAt" type="datetime-local" value={form.saleStartAt} onChange={handleChange} required />
        <Input label="예매 마감 *" name="saleEndAt" type="datetime-local" value={form.saleEndAt} onChange={handleChange} required />
        <Input label="회차" name="roundNumber" type="number" value={form.roundNumber} onChange={handleChange} placeholder="1" />
        <Input label="썸네일 URL" name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleChange} placeholder="https://..." />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">공연 설명</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={3} placeholder="공연 소개를 입력해주세요"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
        </div>
      </section>

      {/* 구역 정보 */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">구역 정보</h2>
          <Button type="button" variant="ghost" size="small" onClick={addSection}>+ 구역 추가</Button>
        </div>

        {sections.map((section, idx) => (
          <div key={idx} className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">구역 {idx + 1}</span>
              {sections.length > 1 && (
                <button type="button" onClick={() => removeSection(idx)}
                  className="text-xs text-red-400 hover:text-red-600">삭제</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="구역명 *" value={section.sectionName}
                onChange={(e) => handleSectionChange(idx, 'sectionName', e.target.value)}
                placeholder="A구역" required />
              <Input label="가격 *" type="number" value={String(section.price)}
                onChange={(e) => handleSectionChange(idx, 'price', Number(e.target.value))}
                placeholder="110000" required />
              <Input label="행 수 *" type="number" value={String(section.rowCount)}
                onChange={(e) => handleSectionChange(idx, 'rowCount', Number(e.target.value))}
                placeholder="10" required />
              <Input label="열 수 *" type="number" value={String(section.colCount)}
                onChange={(e) => handleSectionChange(idx, 'colCount', Number(e.target.value))}
                placeholder="20" required />
            </div>
            <p className="text-xs text-gray-400">
              총 좌석: {section.rowCount * section.colCount}석
            </p>
          </div>
        ))}
      </section>

      <Button type="submit" size="large" loading={loading} className="w-full">
        이벤트 등록
      </Button>
    </form>
  )
}

// ─── 쿠폰 등록 폼 ────────────────────────────────────────────

function CouponCreateForm() {
  const { toast }   = useToast()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name:          '',
    discountAmount: '',
    totalQuantity:  '',
    startAt:        '',
    expiredAt:      '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await createCoupon({
        name:           form.name,
        discountAmount: Number(form.discountAmount),
        totalQuantity:  Number(form.totalQuantity),
        startAt:        form.startAt,
        expiredAt:      form.expiredAt,
      })
      toast.success(`쿠폰 등록 완료! (ID: ${res.couponId}, 수량: ${res.totalQuantity}개)`)
      setForm({ name: '', discountAmount: '', totalQuantity: '', startAt: '', expiredAt: '' })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-700">쿠폰 정보</h2>

        <Input label="쿠폰명 *" name="name" value={form.name} onChange={handleChange}
          placeholder="신규 가입 5,000원 할인" required />
        <Input label="할인 금액 (원) *" name="discountAmount" type="number" value={form.discountAmount}
          onChange={handleChange} placeholder="5000" required />
        <Input label="발급 수량 *" name="totalQuantity" type="number" value={form.totalQuantity}
          onChange={handleChange} placeholder="100" required />
        <Input label="발급 시작 *" name="startAt" type="datetime-local" value={form.startAt}
          onChange={handleChange} required />
        <Input label="사용 만료 *" name="expiredAt" type="datetime-local" value={form.expiredAt}
          onChange={handleChange} required />
      </section>

      <Button type="submit" size="large" loading={loading} className="w-full">
        쿠폰 등록
      </Button>
    </form>
  )
}

// ─── 쿠폰 메트릭스 조회 폼 ──────────────────────────────────

function CouponMetricsForm() {
  const { toast }   = useToast()
  const [couponId, setCouponId]   = useState('')
  const [metrics, setMetrics]     = useState<CouponMetrics | null>(null)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponId) return
    setLoading(true)
    setMetrics(null)
    setError('')
    try {
      const res = await getCouponMetrics(Number(couponId))
      if ('error' in res) {
        setError(res.error)
      } else {
        setMetrics(res)
      }
    } catch {
      toast.error('메트릭스 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="number"
          value={couponId}
          onChange={(e) => setCouponId(e.target.value)}
          placeholder="쿠폰 ID 입력"
          className="w-40"
        />
        <Button type="submit" loading={loading} disabled={!couponId}>
          조회
        </Button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {metrics && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">쿠폰 #{metrics.couponId} 메트릭스</h3>
            <span className="text-xs text-gray-400">
              {new Date(metrics.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>

          {/* 수치 카드 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: '총 시도',        value: metrics.totalAttempts.toLocaleString(), color: 'text-gray-800' },
              { label: 'Redis 성공',     value: metrics.redisSuccess.toLocaleString(),  color: 'text-blue-600' },
              { label: 'DB Fallback',    value: metrics.dbFallback.toLocaleString(),    color: 'text-amber-600' },
              { label: '성공률',         value: pct(metrics.successRate),               color: 'text-green-600' },
              { label: 'Fallback 비율',  value: pct(metrics.fallbackRate),              color: 'text-orange-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-400">{label}</p>
                <p className={['mt-1 text-xl font-extrabold', color].join(' ')}>{value}</p>
              </div>
            ))}
          </div>

          {/* 성공률 바 */}
          <div>
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>성공률</span>
              <span className="font-semibold text-green-600">{pct(metrics.successRate)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: pct(metrics.successRate) }}
              />
            </div>
          </div>

          {/* Fallback 비율 바 */}
          <div>
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>DB Fallback 비율</span>
              <span className="font-semibold text-amber-600">{pct(metrics.fallbackRate)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: pct(metrics.fallbackRate) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 이벤트 상태 변경 폼 ──────────────────────────────────────

const STATUS_LABELS: Record<EventStatus, string> = {
  ON_SALE:   '예매중',
  SOLD_OUT:  '매진',
  CANCELLED: '취소됨',
  ENDED:     '종료됨',
  DELETED:   '삭제됨',
}

function EventStatusForm() {
  const { toast } = useToast()
  const [events, setEvents]       = useState<EventSummary[]>([])
  const [loading, setLoading]     = useState(false)
  const [updating, setUpdating]   = useState<number | null>(null)
  const [fetched, setFetched]     = useState(false)

  const fetchAllEvents = async () => {
    setLoading(true)
    try {
      const res = await getEvents({ page: 0, size: 200, sort: 'createdAt,desc' })
      setEvents(res.content ?? [])
      setFetched(true)
    } catch {
      toast.error('이벤트 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (eventId: number, newStatus: EventStatus) => {
    setUpdating(eventId)
    try {
      await updateEventStatus(eventId, { status: newStatus })
      toast.success(`이벤트 #${eventId} 상태가 ${STATUS_LABELS[newStatus]}(으)로 변경되었습니다.`)
      // 목록 갱신
      await fetchAllEvents()
    } catch (error) {
      const msg = (error as AxiosError<{ message?: string }>).response?.data?.message ?? '상태 변경에 실패했습니다.'
      toast.error(msg)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-4">
      {!fetched ? (
        <div className="text-center py-8">
          <Button onClick={fetchAllEvents} loading={loading}>이벤트 목록 불러오기</Button>
        </div>
      ) : loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">이벤트가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const currentStatus = (event.status ?? 'ON_SALE') as EventStatus
            const allowed = STATUS_TRANSITIONS[currentStatus] ?? []

            return (
              <div key={event.eventId} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-400">#{event.eventId} · {event.category}</p>
                  </div>
                  <StatusBadge status={currentStatus} />
                </div>

                {allowed.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allowed.map((target) => (
                      <Button
                        key={target}
                        size="small"
                        variant={target === 'DELETED' || target === 'CANCELLED' ? 'danger' : 'secondary'}
                        loading={updating === event.eventId}
                        onClick={() => handleStatusChange(event.eventId, target)}
                      >
                        → {STATUS_LABELS[target]}
                      </Button>
                    ))}
                  </div>
                )}

                {allowed.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">상태 변경 불가</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

type Tab = 'event' | 'coupon' | 'metrics' | 'status'

function AdminPage() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('event')

  // ADMIN 권한 체크
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-lg font-bold text-gray-700">접근 권한이 없습니다.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>홈으로</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">관리자 대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">이벤트와 쿠폰을 등록할 수 있습니다.</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-gray-200">
        {([
          { key: 'event',   label: '🎫 이벤트 등록' },
          { key: 'status',  label: '🔄 상태 변경' },
          { key: 'coupon',  label: '🏷 쿠폰 등록' },
          { key: 'metrics', label: '📊 쿠폰 메트릭스' },
        ] as { key: Tab; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              'px-4 py-2 text-sm font-semibold border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'event'   && <EventCreateForm />}
      {activeTab === 'status'  && <EventStatusForm />}
      {activeTab === 'coupon'  && <CouponCreateForm />}
      {activeTab === 'metrics' && <CouponMetricsForm />}

    </div>
  )
}

export default AdminPage
