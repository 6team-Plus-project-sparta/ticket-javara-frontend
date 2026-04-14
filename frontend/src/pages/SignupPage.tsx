/**
 * SignupPage — 회원가입 화면
 *
 * 동작 흐름:
 * 1. 이메일 / 비밀번호 / 비밀번호 확인 / 닉네임 입력
 * 2. 모든 필드 유효 시 회원가입 버튼 활성화
 * 3. 버튼 클릭 → POST /api/auth/signup
 * 4. 성공 → /login 으로 이동
 * 5. 실패 → 에러 코드별 메시지 표시
 *
 * AuthLayout 안에서 렌더링되므로 Header 없이 중앙 카드 형태로 표시된다.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '@/api/auth'
import { Button, Input } from '@/components'
import type { AxiosError } from 'axios'

// ─── 타입 ────────────────────────────────────────────────────

interface FormValues {
  email: string
  password: string
  passwordConfirm: string
  nickname: string
}

interface FormErrors {
  email?: string
  password?: string
  passwordConfirm?: string
  nickname?: string
}

// ─── 유효성 검사 규칙 ─────────────────────────────────────────

const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// 8자 이상, 영문 + 숫자 각 1자 이상 포함
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.email.trim()) {
    errors.email = '이메일을 입력해주세요.'
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해주세요.'
  } else if (!PASSWORD_REGEX.test(values.password)) {
    errors.password = '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.'
  }

  if (!values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호 확인을 입력해주세요.'
  } else if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  }

  if (!values.nickname.trim()) {
    errors.nickname = '닉네임을 입력해주세요.'
  }

  return errors
}

/** 모든 필드가 채워져 있고 유효성 에러가 없는지 확인 */
function isFormValid(values: FormValues, errors: FormErrors): boolean {
  const allFilled =
    values.email.trim() !== '' &&
    values.password !== '' &&
    values.passwordConfirm !== '' &&
    values.nickname.trim() !== ''
  const noErrors = Object.values(errors).every((e) => !e)
  return allFilled && noErrors
}

// ─── 서버 에러 코드 → 사용자 메시지 변환 ─────────────────────

function getServerErrorMessage(error: unknown): { field?: keyof FormErrors; message: string } {
  const axiosError = error as AxiosError<{ code: string; message: string }>
  const code    = axiosError.response?.data?.code
  const message = axiosError.response?.data?.message ?? ''

  switch (code) {
    case 'EMAIL_DUPLICATED':
      return { field: 'email', message: '이미 가입된 이메일입니다.' }
    case 'VALIDATION_FAILED':
      // 서버가 보내준 메시지를 그대로 표시
      return { message: message || '입력값을 다시 확인해주세요.' }
    default:
      return { message: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function SignupPage() {
  const navigate = useNavigate()

  const [values, setValues] = useState<FormValues>({
    email: '', password: '', passwordConfirm: '', nickname: '',
  })
  const [errors, setErrors]           = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)

  // 입력값 변경 — 해당 필드 에러 즉시 초기화
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const next = { ...values, [name]: value }
    setValues(next)

    // 변경된 필드만 재검사해서 에러 업데이트
    const freshErrors = validate(next)
    setErrors((prev) => ({ ...prev, [name]: freshErrors[name as keyof FormErrors] }))
    setServerError('')
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 전체 유효성 검사
    const validationErrors = validate(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setServerError('')

    try {
      await signup({
        email:    values.email,
        password: values.password,
        nickname: values.nickname,
      })
      // 성공 → 로그인 페이지로 이동 (성공 안내는 로그인 페이지에서 처리 가능)
      navigate('/login', { replace: true })
    } catch (error) {
      const { field, message } = getServerErrorMessage(error)
      if (field) {
        // 특정 필드 에러로 표시 (예: 이메일 중복)
        setErrors((prev) => ({ ...prev, [field]: message }))
      } else {
        // 공통 에러 배너로 표시
        setServerError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const submittable = isFormValid(values, errors)

  return (
    <div>
      {/* 타이틀 */}
      <h2 className="mb-1 text-xl font-bold text-gray-900">회원가입</h2>
      <p className="mb-6 text-sm text-gray-500">티켓을 JAVA라 계정을 만들어보세요</p>

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
          placeholder="영문+숫자 포함 8자 이상"
          error={errors.password}
          helperText={!errors.password ? '영문과 숫자를 포함해 8자 이상 입력해주세요.' : undefined}
          autoComplete="new-password"
          disabled={loading}
        />

        {/* 비밀번호 확인 */}
        <Input
          label="비밀번호 확인"
          type="password"
          name="passwordConfirm"
          value={values.passwordConfirm}
          onChange={handleChange}
          placeholder="비밀번호를 다시 입력해주세요"
          error={errors.passwordConfirm}
          autoComplete="new-password"
          disabled={loading}
        />

        {/* 닉네임 */}
        <Input
          label="닉네임"
          type="text"
          name="nickname"
          value={values.nickname}
          onChange={handleChange}
          placeholder="사용할 닉네임을 입력해주세요"
          error={errors.nickname}
          autoComplete="nickname"
          disabled={loading}
        />

        {/* 서버 공통 에러 배너 */}
        {serverError && (
          <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
            {serverError}
          </div>
        )}

        {/* 회원가입 버튼 */}
        <Button
          type="submit"
          size="large"
          loading={loading}
          disabled={!submittable}
          className="mt-1 w-full"
        >
          회원가입
        </Button>

      </form>

      {/* 로그인 링크 */}
      <p className="mt-5 text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="font-medium text-blue-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  )
}

export default SignupPage
