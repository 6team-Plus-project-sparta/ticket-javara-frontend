/**
 * SearchBar 컴포넌트
 * - 검색어 입력 + 검색 버튼
 * - onSearch: 검색 실행 핸들러 (엔터 키 또는 버튼 클릭)
 * - placeholder: 입력창 안내 문구
 * - defaultValue: 초기 검색어 (URL 쿼리 파라미터 복원 시 사용)
 */

import { useState } from 'react'

interface SearchBarProps {
  onSearch: (keyword: string) => void
  placeholder?: string
  defaultValue?: string
  className?: string
}

function SearchBar({ onSearch, placeholder = '공연, 아티스트, 장소 검색', defaultValue = '', className = '' }: SearchBarProps) {
  const [keyword, setKeyword] = useState(defaultValue)

  // 엔터 키 입력 시 검색 실행
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch(keyword.trim())
  }

  return (
    <div className={['flex items-center gap-2 w-full', className].join(' ')}>
      <div className="relative flex-1">
        {/* 돋보기 아이콘 */}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </span>
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="검색어 입력"
          className="w-full rounded-full border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={() => onSearch(keyword.trim())}
        aria-label="검색"
        className="shrink-0 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        검색
      </button>
    </div>
  )
}

export default SearchBar
