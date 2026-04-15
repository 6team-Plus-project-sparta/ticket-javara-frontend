/**
 * ErrorBoundary — 런타임 에러를 잡아서 흰 화면 대신 에러 메시지를 표시
 * 개발 중 어디서 에러가 나는지 바로 확인할 수 있게 에러 내용을 노출
 */

import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900">앱 실행 중 오류가 발생했습니다</h1>
          <p className="text-sm text-gray-500">아래 에러 내용을 확인해주세요.</p>
          <pre className="mt-4 max-w-2xl overflow-auto rounded-lg bg-red-50 p-4 text-left text-xs text-red-700 border border-red-200">
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            새로고침
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
