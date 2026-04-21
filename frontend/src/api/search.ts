// 검색 관련 API - 인기 검색어 조회 및 클릭 이벤트
import apiClient from './client'
import type { PopularKeyword } from '../types/search'

/** 백엔드 공통 응답 래퍼 */
interface ApiWrapper<T> {
  data: T
  code: string
  message: string
}

function unwrap<T>(data: ApiWrapper<T> | T): T {
  const d = data as ApiWrapper<T>
  return d?.data !== undefined ? d.data : (data as T)
}

// 인기 검색어 목록 조회
export const getPopularKeywords = async (): Promise<PopularKeyword[]> => {
  const response = await apiClient.get<ApiWrapper<PopularKeyword[]>>('/search/popular')
  return unwrap(response.data)
}

// 인기 검색어 클릭 이벤트 전송
export const clickPopularKeyword = async (
  keyword: string
): Promise<{ message: string; keyword: string }> => {
  const response = await apiClient.post<ApiWrapper<{ message?: string; keyword?: string }>>(
    '/search/popular/click',
    { keyword }
  )
  const result = unwrap(response.data)
  return {
    message: result?.message ?? 'ok',
    keyword: result?.keyword ?? keyword,
  }
}
