/**
 * Input 컴포넌트
 * - label: 입력 필드 위 라벨
 * - error: 에러 메시지 (빨간색)
 * - helperText: 안내 문구 (회색)
 * - type: 'text' | 'password' | 'email' 등 HTML input type 모두 지원
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

function Input({ label, error, helperText, id, className = '', ...props }: InputProps) {
  const inputId = id ?? `input-${label?.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={[
          'w-full rounded-md border px-3 py-2 text-sm',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-500">{error}</p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-gray-400">{helperText}</p>
      )}
    </div>
  )
}

export default Input
