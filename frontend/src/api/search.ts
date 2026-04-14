// 검색 관련 API - 인기 검색어 조회 및 클릭 이벤트
import apiClient from './client'
import type { PopularKeyword } from '../types/search'

// 인기 검색어 목록 조회
export const getPopularKeywords = async (): Promise<PopularKeyword[]> => {
  const response = await apiClient.get<PopularKeyword[]>('/search/popular')
  return response.data
}

// 인기 검색어 클릭 이벤트 전송
export const clickPopularKeyword = async (
  keyword: string
): Promise<{ message: string; keyword: string }> => {
  const response = await apiClient.post<{ message: string; keyword: string }>('/search/popular/click', {
    keyword,
  })
  return response.data
}
