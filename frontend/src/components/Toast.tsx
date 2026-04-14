/**
 * Toast 컴포넌트 + useToast 훅
 *
 * 사용법:
 *   1. App.tsx 최상단에 <ToastContainer /> 추가
 *   2. 어느 컴포넌트에서든 useToast() 훅으로 toast 함수 호출
 *
 * 예시:
 *   const { toast } = useToast()
 *   toast.success('예매가 완료되었습니다!')
 *   toast.error('오류가 발생했습니다.')
 */

import { createContext, useCallback, useContext, useState } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

// 타입별 아이콘 + 색상
const toastConfig: Record<ToastType, { icon: string; className: string }> = {
  success: { icon: '✓', className: 'bg-green-600' },
  error:   { icon: '✕', className: 'bg-red-600' },
  warning: { icon: '!', className: 'bg-yellow-500' },
  info:    { icon: 'i', className: 'bg-blue-600' },
}

let toastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // 토스트 추가 후 3초 뒤 자동 제거
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const toast = {
    success: (message: string) => addToast('success', message),
    error:   (message: string) => addToast('error', message),
    warning: (message: string) => addToast('warning', message),
    info:    (message: string) => addToast('info', message),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* 토스트 컨테이너 — 화면 우측 하단 */}
      <div aria-live="polite" aria-atomic="false" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => {
          const config = toastConfig[t.type]
          return (
            <div
              key={t.id}
              role="alert"
              className={['flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg min-w-64 max-w-sm', config.className].join(' ')}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/30 text-xs font-bold" aria-hidden="true">
                {config.icon}
              </span>
              <p className="text-sm">{t.message}</p>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

/** 토스트를 띄우는 훅. ToastProvider 하위에서만 사용 가능 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast는 ToastProvider 안에서 사용해야 합니다.')
  return ctx
}

export default ToastProvider
