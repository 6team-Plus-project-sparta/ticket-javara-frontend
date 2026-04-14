/**
 * LoadingSpinner 컴포넌트
 * - API 호출 중 로딩 상태를 표시
 * - size: small | medium | large
 * - fullScreen: true이면 화면 전체를 덮는 오버레이로 표시
 */

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  fullScreen?: boolean
  label?: string
}

const sizeClass = {
  small: 'h-4 w-4 border-2',
  medium: 'h-8 w-8 border-2',
  large: 'h-12 w-12 border-4',
}

function LoadingSpinner({ size = 'medium', fullScreen = false, label = '로딩 중' }: LoadingSpinnerProps) {
  const spinner = (
    <div role="status" aria-label={label} className="flex items-center justify-center">
      <div className={['animate-spin rounded-full border-gray-200 border-t-blue-600', sizeClass[size]].join(' ')} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )

  if (fullScreen) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">{spinner}</div>
  }

  return <div className="flex items-center justify-center py-12">{spinner}</div>
}

export default LoadingSpinner
