/**
 * storage.ts — 토큰 저장/조회/삭제 유틸
 *
 * localStorage를 직접 쓰는 코드가 여러 파일에 흩어지면 나중에 수정이 어려워요.
 * 이 파일 한 곳에서만 localStorage를 다루고, 다른 파일은 이 함수들을 가져다 씁니다.
 *
 * 예시:
 *   import { saveToken, getToken, removeToken } from '@/utils/storage'
 *   saveToken(accessToken)   // 로그인 성공 후 저장
 *   getToken()               // API 요청 시 꺼내기
 *   removeToken()            // 로그아웃 시 삭제
 */

const TOKEN_KEY = 'accessToken'

/** accessToken을 localStorage에 저장 */
export const saveToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

/** localStorage에서 accessToken 조회. 없으면 null 반환 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

/** localStorage에서 accessToken 삭제 (로그아웃 시 사용) */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

/** 로그인 상태 여부 확인 */
export const isLoggedIn = (): boolean => {
  return getToken() !== null
}
