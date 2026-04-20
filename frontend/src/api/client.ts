/**
 * client.ts — axios 인스턴스
 *
 * 모든 API 요청은 이 인스턴스를 통해 보냅니다.
 * - baseURL: .env 파일의 VITE_API_BASE_URL 값을 읽어옵니다.
 * - 요청 인터셉터: 저장된 accessToken이 있으면 Authorization 헤더에 자동으로 추가
 * - 응답 인터셉터 (성공):
 *     백엔드가 { data: T, code, message } 래퍼로 응답하는 경우
 *     response.data.data 가 있으면 response.data 를 언래핑해서 반환
 *     → 각 API 함수에서 response.data 를 그대로 쓰면 실제 데이터가 나옴
 *     단, 로그인/회원가입은 auth.ts 에서 래퍼째로 직접 접근하므로 제외
 * - 응답 인터셉터 (에러): 401 응답 시 토큰 삭제 후 로그인 페이지로 이동
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

// 응답 인터셉터: 래퍼 언래핑 + 공통 에러 처리
apiClient.interceptors.response.use(
    (response) => {
        const url = response.config?.url ?? ''

        // 로그인/회원가입은 auth.ts에서 래퍼째로 직접 접근 — 언래핑 제외
        const isAuthEndpoint =
            url.includes('/auth/login') || url.includes('/auth/signup')

        // 백엔드 공통 래퍼 구조: { data: T, code: string, message: string }
        // data 필드가 있으면 언래핑해서 response.data 를 실제 데이터로 교체
        if (!isAuthEndpoint && response.data && response.data.data !== undefined) {
            response.data = response.data.data
        }

        return response
    },
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url ?? ''
            const isAuthEndpoint =
                url.includes('/auth/login') || url.includes('/auth/signup')
            if (!isAuthEndpoint) {
                removeToken()
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    },
)

export default apiClient