/**
 * Pagination 컴포넌트
 * - currentPage: 현재 페이지 (0-indexed, 서버 응답 기준)
 * - totalPages: 전체 페이지 수
 * - onPageChange: 페이지 변경 핸들러
 * - 최대 5개 페이지 번호 표시, 앞뒤 이동 버튼 포함
 */

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  // 현재 페이지 기준으로 최대 5개 페이지 번호 계산
  const getPageNumbers = () => {
    const delta = 2
    const start = Math.max(0, currentPage - delta)
    const end = Math.min(totalPages - 1, currentPage + delta)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const pageNumbers = getPageNumbers()

  const btnBase = 'flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors'
  const btnActive = 'bg-blue-600 text-white'
  const btnDefault = 'text-gray-600 hover:bg-gray-100'
  const btnDisabled = 'text-gray-300 cursor-not-allowed'

  return (
    <nav aria-label="페이지 이동" className="flex items-center justify-center gap-1">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        aria-label="이전 페이지"
        className={[btnBase, currentPage === 0 ? btnDisabled : btnDefault].join(' ')}
      >
        ‹
      </button>

      {/* 첫 페이지 + 생략 */}
      {pageNumbers[0] > 0 && (
        <>
          <button onClick={() => onPageChange(0)} className={[btnBase, btnDefault].join(' ')}>1</button>
          {pageNumbers[0] > 1 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {/* 페이지 번호 */}
      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={[btnBase, page === currentPage ? btnActive : btnDefault].join(' ')}
        >
          {page + 1}
        </button>
      ))}

      {/* 마지막 페이지 + 생략 */}
      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 2 && <span className="px-1 text-gray-400">…</span>}
          <button onClick={() => onPageChange(totalPages - 1)} className={[btnBase, btnDefault].join(' ')}>{totalPages}</button>
        </>
      )}

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        aria-label="다음 페이지"
        className={[btnBase, currentPage === totalPages - 1 ? btnDisabled : btnDefault].join(' ')}
      >
        ›
      </button>
    </nav>
  )
}

export default Pagination
