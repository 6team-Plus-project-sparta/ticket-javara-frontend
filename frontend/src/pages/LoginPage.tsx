/**
 * LoginPage — 로그인 화면
 *
 * 동작 흐름:
 * 1. 이메일 + 비밀번호 입력
 * 2. 로그인 버튼 클릭 → POST /api/auth/login
 * 3. 성공 → accessToken 저장 → GET /api/users/me → 홈(/)으로 이동
 * 4. 실패 → 에러 메시지 표시
 *
 * AuthLayout 안에서 렌더링되므로 Header 없이 중앙 카드 형태로 표시된다.
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input } from '@/components'
import type { AxiosError } from 'axios'

// ─── 타입 ────────────────────────────────────────────────────

interface FormValues {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

// ─── 유효성 검사 ──────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 폼 유효성 검사 — 에러가 있으면 errors 객체 반환, 없으면 빈 객체 */
function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.email.trim()) {
    errors.email = '이메일을 입력해주세요.'
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }

  if (!values.password.trim()) {
    errors.password = '비밀번호를 입력해주세요.'
  }

  return errors
}

// ─── 서버 에러 코드 → 사용자 메시지 변환 ─────────────────────

function getServerErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ code: string; message: string; data?: { code?: string } }>
  const responseData = axiosError.response?.data

  // 백엔드 공통 래퍼 구조: { code, message } 또는 { data: { code } }
  const code = responseData?.code ?? responseData?.data?.code
  const status = axiosError.response?.status

  // 토큰을 못 찾은 경우 (AuthContext에서 throw한 에러)
  if (error instanceof Error && error.message === '토큰을 찾을 수 없습니다.') {
    return '이메일 또는 비밀번호가 올바르지 않습니다.'
  }

  switch (code) {
    case 'AUTHENTICATION_FAILED':
      return '이메일 또는 비밀번호가 올바르지 않습니다.'
    default:
      // 401이면 인증 실패로 안내
      if (status === 401) return '이메일 또는 비밀번호가 올바르지 않습니다.'
      return '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // ProtectedRoute에서 전달한 원래 경로 — 없으면 홈으로
  const from = (location.state as { from?: string })?.from ?? '/'

  // 폼 입력값
  const [values, setValues] = useState<FormValues>({ email: '', password: '' })
  // 필드별 유효성 에러
  const [errors, setErrors] = useState<FormErrors>({})
  // 서버 응답 에러 메시지
  const [serverError, setServerError] = useState('')
  // 로그인 요청 중 여부
  const [loading, setLoading] = useState(false)

  // 입력값 변경 핸들러 — 입력 시 해당 필드 에러 초기화
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setServerError('')
  }

  // 로그인 버튼 활성화 조건 — 두 필드 모두 입력된 경우
  const isSubmittable = values.email.trim() !== '' && values.password.trim() !== ''

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 클라이언트 유효성 검사
    const validationErrors = validate(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setServerError('')

    try {
      // AuthContext.login() — 토큰 저장 + GET /api/users/me 까지 처리
      await login({ email: values.email, password: values.password })
      // 로그인 전 접근하려던 페이지로 복귀 (없으면 홈)
      navigate(from, { replace: true })
    } catch (error) {
      setServerError(getServerErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* 타이틀 */}
      <h2 className="mb-1 text-xl font-bold text-gray-900">로그인</h2>
      <p className="mb-6 text-sm text-gray-500">티켓을 JAVA라에 오신 것을 환영합니다</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

        {/* 이메일 */}
        <Input
          label="이메일"
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          placeholder="example@email.com"
          error={errors.email}
          autoComplete="email"
          autoFocus
          disabled={loading}
        />

        {/* 비밀번호 */}
        <Input
          label="비밀번호"
          type="password"
          name="password"
          value={values.password}
          onChange={handleChange}
          placeholder="비밀번호를 입력해주세요"
          error={errors.password}
          autoComplete="current-password"
          disabled={loading}
        />

        {/* 서버 에러 메시지 */}
        {serverError && (
          <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
            {serverError}
          </div>
        )}

        {/* 로그인 버튼 */}
        <Button
          type="submit"
          size="large"
          loading={loading}
          disabled={!isSubmittable}
          className="mt-1 w-full"
        >
          로그인
        </Button>

      </form>

      {/* 회원가입 링크 */}
      <p className="mt-5 text-center text-sm text-gray-500">
        아직 계정이 없으신가요?{' '}
        <Link
          to="/signup"
          className="font-medium text-blue-600 hover:underline"
        >
          회원가입
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
