/**
 * EditProfilePage — 내 정보 수정 화면
 *
 * 동작 흐름:
 * 1. 진입 시 GET /api/users/me → 현재 닉네임 표시
 * 2. 닉네임 / 현재 비밀번호 / 새 비밀번호 / 새 비밀번호 확인 입력
 * 3. 저장 → PATCH /api/users/me
 * 4. 성공 → fetchMe()로 AuthContext user 갱신 → 성공 토스트
 *
 * 규칙:
 * - 닉네임만 바꿀 때도 currentPassword 필수 (API 명세 기준)
 * - 새 비밀번호를 입력한 경우에만 password 필드 전송
 * - 새 비밀번호 입력 시 확인 일치 검사
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, updateMe } from '@/api/users'
import type { UserProfile } from '@/types/user'
import type { AxiosError } from 'axios'
import { Button, Input, LoadingSpinner } from '@/components'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'

// ─── 타입 ────────────────────────────────────────────────────

interface FormValues {
  nickname: string
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

interface FormErrors {
  nickname?: string
  currentPassword?: string
  newPassword?: string
  newPasswordConfirm?: string
}

// ─── 유효성 검사 ──────────────────────────────────────────────

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.nickname.trim()) {
    errors.nickname = '닉네임을 입력해주세요.'
  }

  if (!values.currentPassword) {
    errors.currentPassword = '현재 비밀번호를 입력해주세요.'
  }

  // 새 비밀번호는 입력한 경우에만 검사
  if (values.newPassword) {
    if (!PASSWORD_REGEX.test(values.newPassword)) {
      errors.newPassword = '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.'
    }
    if (!values.newPasswordConfirm) {
      errors.newPasswordConfirm = '새 비밀번호 확인을 입력해주세요.'
    } else if (values.newPassword !== values.newPasswordConfirm) {
      errors.newPasswordConfirm = '새 비밀번호가 일치하지 않습니다.'
    }
  }

  return errors
}

// ─── 에러 코드 → 메시지 ──────────────────────────────────────

function getServerError(error: unknown): { field?: keyof FormErrors; message: string } {
  const code = (error as AxiosError<{ code: string }>).response?.data?.code
  switch (code) {
    case 'INVALID_CURRENT_PASSWORD':
      return { field: 'currentPassword', message: '현재 비밀번호가 올바르지 않습니다.' }
    case 'NICKNAME_DUPLICATED':
      return { field: 'nickname', message: '이미 사용 중인 닉네임입니다.' }
    default:
      return { message: '저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

function EditProfilePage() {
  const navigate        = useNavigate()
  const { fetchMe }     = useAuth()
  const { toast }       = useToast()

  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [pageLoading, setPageLoading] = useState(true)

  const [values, setValues]     = useState<FormValues>({
    nickname: '', currentPassword: '', newPassword: '', newPasswordConfirm: '',
  })
  const [errors, setErrors]     = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving]     = useState(false)

  // 진입 시 내 정보 조회 → 닉네임 초기값 설정
  useEffect(() => {
    getMe()
      .then((data) => {
        setProfile(data)
        setValues((prev) => ({ ...prev, nickname: data.nickname }))
      })
      .catch(() => {
        toast.error('내 정보를 불러오지 못했습니다.')
        navigate('/mypage')
      })
      .finally(() => setPageLoading(false))
  }, [navigate, toast])

  // 입력 변경 — 해당 필드 에러 즉시 초기화
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const next = { ...values, [name]: value }
    setValues(next)
    if (profile) {
      const freshErrors = validate(next)
      setErrors((prev) => ({ ...prev, [name]: freshErrors[name as keyof FormErrors] }))
    }
    setServerError('')
  }

  // 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    const validationErrors = validate(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)
    setServerError('')

    try {
      await updateMe({
        nickname:        values.nickname.trim(),
        currentPassword: values.currentPassword,
        // 새 비밀번호를 입력한 경우에만 전송
        ...(values.newPassword && { password: values.newPassword }),
      })

      // AuthContext user 상태 갱신
      await fetchMe()

      toast.success('내 정보가 수정되었습니다.')

      // 비밀번호 필드 초기화
      setValues((prev) => ({ ...prev, currentPassword: '', newPassword: '', newPasswordConfirm: '' }))
      setErrors({})
    } catch (error) {
      const { field, message } = getServerError(error)
      if (field) {
        setErrors((prev) => ({ ...prev, [field]: message }))
      } else {
        setServerError(message)
      }
    } finally {
      setSaving(false)
    }
  }

  if (pageLoading) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-md space-y-6">

      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/mypage')}
          aria-label="마이페이지로 돌아가기"
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">내 정보 수정</h1>
      </div>

      {/* 현재 계정 정보 */}
      {profile && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{profile.email}</span>
          <span className="mx-2 text-gray-300">·</span>
          현재 닉네임:{' '}
          <span className="font-medium text-gray-700">{profile.nickname}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* 닉네임 섹션 */}
        <section aria-labelledby="nickname-section">
          <h2 id="nickname-section" className="mb-3 text-sm font-bold text-gray-700">
            닉네임 변경
          </h2>
          <Input
            label="새 닉네임"
            type="text"
            name="nickname"
            value={values.nickname}
            onChange={handleChange}
            placeholder="사용할 닉네임을 입력해주세요"
            error={errors.nickname}
            disabled={saving}
          />
        </section>

        <hr className="border-gray-100" />

        {/* 비밀번호 섹션 */}
        <section aria-labelledby="password-section" className="space-y-4">
          <h2 id="password-section" className="text-sm font-bold text-gray-700">
            비밀번호
          </h2>

          {/* 현재 비밀번호 — 항상 필수 */}
          <Input
            label="현재 비밀번호"
            type="password"
            name="currentPassword"
            value={values.currentPassword}
            onChange={handleChange}
            placeholder="현재 비밀번호를 입력해주세요"
            error={errors.currentPassword}
            helperText="닉네임만 변경하는 경우에도 현재 비밀번호가 필요합니다."
            autoComplete="current-password"
            disabled={saving}
          />

          {/* 새 비밀번호 — 선택 입력 */}
          <Input
            label="새 비밀번호 (선택)"
            type="password"
            name="newPassword"
            value={values.newPassword}
            onChange={handleChange}
            placeholder="변경할 비밀번호 (영문+숫자 8자 이상)"
            error={errors.newPassword}
            helperText={!errors.newPassword ? '변경하지 않으려면 비워두세요.' : undefined}
            autoComplete="new-password"
            disabled={saving}
          />

          {/* 새 비밀번호 확인 — 새 비밀번호 입력 시에만 표시 */}
          {values.newPassword && (
            <Input
              label="새 비밀번호 확인"
              type="password"
              name="newPasswordConfirm"
              value={values.newPasswordConfirm}
              onChange={handleChange}
              placeholder="새 비밀번호를 다시 입력해주세요"
              error={errors.newPasswordConfirm}
              autoComplete="new-password"
              disabled={saving}
            />
          )}
        </section>

        {/* 서버 공통 에러 */}
        {serverError && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        {/* 저장 버튼 */}
        <Button
          type="submit"
          size="large"
          loading={saving}
          disabled={!values.currentPassword.trim()}
          className="w-full"
        >
          저장하기
        </Button>

      </form>
    </div>
  )
}

export default EditProfilePage
