// 공통 타입 정의 - API 에러 응답, 페이지네이션 응답

// 공통 API 에러 응답
export interface ApiError {
  status: number
  code: string
  message: string
  timestamp?: string
}

// 공통 페이지네이션 응답
export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  page: number
  size: number
}
