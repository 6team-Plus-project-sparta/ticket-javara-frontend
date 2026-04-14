/**
 * CountdownTimer 컴포넌트
 * - 좌석 Hold 만료까지 남은 시간을 mm:ss 형식으로 표시
 * - expiresAt: 만료 시각 (ISO 8601 문자열, 예: "2026-04-09T20:10:00")
 * - onExpire: 시간이 0이 됐을 때 호출되는 콜백
 * - 30초 이하일 때 빨간색 + 깜빡임으로 강조
 */

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  expiresAt: string
  onExpire?: () => void
  className?: string
}

function CountdownTimer({ expiresAt, onExpire, className = '' }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  )

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.()
      return
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(timer)
          onExpire?.()
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt]) // expiresAt이 바뀌면 타이머 재시작

  // mm:ss 형식으로 변환
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')

  // 30초 이하일 때 강조 스타일
  const isUrgent = remaining <= 30 && remaining > 0
  const isExpired = remaining === 0

  return (
    <div
      role="timer"
      aria-label={`남은 시간 ${minutes}분 ${seconds}초`}
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-mono font-semibold',
        isExpired  ? 'bg-gray-100 text-gray-400' :
        isUrgent   ? 'bg-red-100 text-red-600 animate-pulse' :
                     'bg-blue-50 text-blue-700',
        className,
      ].join(' ')}
    >
      {/* 시계 아이콘 */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {isExpired ? '시간 만료' : `${minutes}:${seconds}`}
    </div>
  )
}

export default CountdownTimer
