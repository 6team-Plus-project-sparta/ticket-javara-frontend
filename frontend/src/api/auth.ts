// 인증 관련 API - 회원가입, 로그인
import apiClient from './client'
import type { SignupRequest, SignupResponse, LoginRequest, LoginResponse } from '../types/auth'

// 회원가입
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<SignupResponse>('/auth/signup', data)
  return response.data
}

// 로그인
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data)
  return response.data
}
