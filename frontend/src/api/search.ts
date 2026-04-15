// 검색 관련 API - 인기 검색어 조회 및 클릭 이벤트
import apiClient from './client'
import type { PopularKeyword } from '../types/search'

// 인기 검색어 목록 조회
// TODO: 백엔드 /api/search/popular 엔드포인트 구현 전까지 빈 배열 반환
export const getPopularKeywords = async (): Promise<PopularKeyword[]> => {
  return []
}

// 인기 검색어 클릭 이벤트 전송
// TODO: 백엔드 /api/search/popular/click 엔드포인트 구현 전까지 no-op
export const clickPopularKeyword = async (
  _keyword: string
): Promise<{ message: string; keyword: string }> => {
  return { message: '', keyword: _keyword }
}
