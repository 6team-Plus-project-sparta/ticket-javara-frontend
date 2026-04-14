// 404 페이지 — 존재하지 않는 경로 접근 시 표시
import { Link } from 'react-router-dom'
import { Button } from '@/components'

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-gray-200">404</p>
      <p className="text-lg font-medium text-gray-700">페이지를 찾을 수 없습니다.</p>
      <Link to="/">
        <Button>홈으로 돌아가기</Button>
      </Link>
    </div>
  )
}

export default NotFoundPage
