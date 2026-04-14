/**
 * Modal 컴포넌트
 * - isOpen: true일 때 표시
 * - onClose: 닫기 버튼 / 배경 클릭 / ESC 키로 닫기
 * - onConfirm: 확인 버튼 핸들러 (없으면 확인 버튼 미표시)
 * - confirmVariant: 확인 버튼 색상 (danger 등)
 * - loading: 확인 버튼 로딩 상태
 */

import { useEffect } from 'react'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  children: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
}

function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = '확인',
  cancelLabel = '취소',
  confirmVariant = 'primary',
  loading = false,
}: ModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* 모달 본체 */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl mx-4">
        {/* 제목 + 닫기 버튼 */}
        <div className="flex items-center justify-between mb-3">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="모달 닫기"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="text-sm text-gray-600 mb-6">{children}</div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          {onConfirm && (
            <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal
