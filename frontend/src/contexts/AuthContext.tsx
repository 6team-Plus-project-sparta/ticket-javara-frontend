/**
 * AuthContext — 인증 전역 상태 관리
 *
 * 이 파일이 하는 일:
 * 1. accessToken, user, isLoggedIn 상태를 앱 전체에서 공유
 * 2. login()  — 로그인 API 호출 → 토큰 저장 → 내 정보 조회
 * 3. logout() — 토큰 삭제 → 상태 초기화
 * 4. fetchMe() — 저장된 토큰으로 내 정보 재조회 (앱 시작 시 로그인 상태 복원)
 *
 * 사용법:
 *   1. main.tsx에서 <AuthProvider>로 앱을 감싼다
 *   2. 어느 컴포넌트에서든 useAuth() 훅으로 상태와 함수를 꺼내 쓴다
 *
 * 예시:
 *   const { isLoggedIn, user, login, logout } = useAuth()
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { login as loginApi } from '@/api/auth'
import { getMe } from '@/api/users'
import { saveToken, getToken, removeToken } from '@/utils/storage'
import type { LoginRequest } from '@/types/auth'
import type { UserProfile } from '@/types/user'

// ─── 타입 정의 ───────────────────────────────────────────────

/** Context에서 제공하는 값의 타입 */
interface AuthContextValue {
  /** 현재 저장된 accessToken. 없으면 null */
  accessToken: string | null
  /** 로그인 여부 */
  isLoggedIn: boolean
  /** 로그인한 사용자 정보. 로그인 전이면 null */
  user: UserProfile | null
  /** 앱 시작 시 토큰 복원 중인지 여부 (초기 로딩 스피너 표시용) */
  isInitializing: boolean
  /** 로그인: API 호출 → 토큰 저장 → 내 정보 조회 */
  login: (data: LoginRequest) => Promise<void>
  /** 로그아웃: 토큰 삭제 → 상태 초기화 */
  logout: () => void
  /** 저장된 토큰으로 내 정보 재조회 */
  fetchMe: () => Promise<void>
}

// ─── Context 생성 ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(getToken())
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  /** 저장된 토큰으로 내 정보를 조회해서 user 상태를 채운다 */
  const fetchMe = useCallback(async () => {
    try {
      const profile = await getMe()
      console.log('[AuthContext] fetchMe 성공:', profile)
      setUser(profile)
    } catch (e) {
      console.warn('[AuthContext] fetchMe 실패 (user=null 유지, 토큰은 보존):', e)
      setUser(null)
    }
  }, [])

  /**
   * 앱 시작 시 실행 — localStorage에 토큰이 있으면 내 정보를 다시 불러와
   * 로그인 상태를 복원한다. (새로고침해도 로그인 유지)
   */
  useEffect(() => {
    const token = getToken()
    if (token) {
      fetchMe().finally(() => setIsInitializing(false))
    } else {
      setIsInitializing(false)
    }
  }, [fetchMe])

  /** 로그인: 토큰 저장 후 내 정보 조회 */
  const login = useCallback(async (data: LoginRequest) => {
    const response = await loginApi(data)

    console.log('[Auth] response.data:', response.data)
    console.log('[Auth] response.headers:', response.headers)

    // 백엔드 공통 래퍼: { data: { accessToken }, code, message }
    const bodyToken = response.data?.data?.accessToken

    console.log('[Auth] bodyToken:', bodyToken)

    if (!bodyToken) {
      console.error('[Auth] 토큰 없음. 전체 data:', JSON.stringify(response.data))
      throw new Error('토큰을 찾을 수 없습니다.')
    }

    // "Bearer " 접두사 제거 (있을 경우)
    const accessToken = bodyToken.startsWith('Bearer ') ? bodyToken.slice(7) : bodyToken

    console.log('[Auth] 저장할 accessToken:', accessToken)

    saveToken(accessToken)
    setAccessToken(accessToken)
    await fetchMe()
  }, [fetchMe])

  /** 로그아웃: 토큰 삭제 + 상태 초기화 */
  const logout = useCallback(() => {
    removeToken()
    setAccessToken(null)
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    accessToken,
    // accessToken만 있으면 로그인 상태로 판단 (user 조회 실패해도 로그인 유지)
    isLoggedIn: !!accessToken,
    user,
    isInitializing,
    login,
    logout,
    fetchMe,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── useAuth 훅 ───────────────────────────────────────────────

/**
 * useAuth — AuthContext 값을 꺼내는 훅
 *
 * 반드시 <AuthProvider> 하위 컴포넌트에서만 사용해야 합니다.
 *
 * 예시:
 *   const { isLoggedIn, user, login, logout } = useAuth()
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.')
  return ctx
}
