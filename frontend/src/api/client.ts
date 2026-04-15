/**
 * client.ts — axios 인스턴스
 *
 * 모든 API 요청은 이 인스턴스를 통해 보냅니다.
 * - baseURL: .env 파일의 VITE_API_BASE_URL 값을 읽어옵니다.
 *   (.env 파일에 VITE_API_BASE_URL=http://localhost:8080/api 로 설정)
 * - 요청 인터셉터: 저장된 accessToken이 있으면 Authorization 헤더에 자동으로 추가
 * - 응답 인터셉터: 401 응답 시 토큰 삭제 후 로그인 페이지로 이동
 */

import axios from 'axios'
import { removeToken } from '@/utils/storage'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터: 토큰이 있으면 모든 요청 헤더에 자동으로 Bearer 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 응답 인터셉터: 공통 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? ''
      // 로그인/회원가입 API는 인터셉터 개입 없이 호출부에서 직접 처리
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/signup')
      if (!isAuthEndpoint) {
        // 인증 만료 → 토큰 삭제 후 로그인 페이지로 이동
        removeToken()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient