// 공통 API 응답 타입
export interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

// 공통 페이지네이션 타입
export interface Pagination {
  page: number
  size: number
  totalElements: number
  totalPages: number
}
