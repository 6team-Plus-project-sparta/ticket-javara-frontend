// 인증 관련 타입 정의 - 회원가입, 로그인 요청/응답

export interface SignupRequest {
  email: string
  password: string
  nickname: string
}

export interface SignupResponse {
  userId: number
  email: string
  nickname: string
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  tokenType: string
}

/** 백엔드 공통 응답 래퍼: { data: T, code: string, message: string } */
export interface ApiWrapper<T> {
  data: T
  code: string
  message: string
}
