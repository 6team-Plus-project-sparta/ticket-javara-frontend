// 인증 관련 API - 회원가입, 로그인
import apiClient from './client'
import type { SignupRequest, SignupResponse, LoginRequest, LoginResponse, ApiWrapper } from '../types/auth'
import type { AxiosResponse } from 'axios'

// 회원가입
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<ApiWrapper<SignupResponse>>('/auth/signup', data)
  return response.data.data
}

// 로그인 — response 전체 반환 (body + headers 모두 접근 가능하게)
export const login = async (data: LoginRequest): Promise<AxiosResponse<ApiWrapper<LoginResponse>>> => {
  const response = await apiClient.post<ApiWrapper<LoginResponse>>('/auth/login', data)
  return response
}
