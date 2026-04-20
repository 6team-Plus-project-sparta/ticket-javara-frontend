// 공통 타입 정의 - API 에러 응답, 페이지네이션 응답

// 공통 API 에러 응답
export interface ApiError {
  status: number
  code: string
  message: string
  timestamp?: string
}

// 백엔드 페이지 메타 (Spring Data 새 구조: data.page 안에 위치)
interface PageMeta {
  size: number
  number: number
  totalElements: number
  totalPages: number
}

// 공통 페이지네이션 응답
// 백엔드 응답: { content: T[], page: { totalPages, totalElements, size, number } }
export interface PageResponse<T> {
  content: T[]
  // Spring Data 새 구조 — page 객체 안에 메타 정보
  page?: PageMeta
  // 구버전 호환 (백엔드가 최상위로 내려줄 경우 대비)
  totalPages?: number
  totalElements?: number
}