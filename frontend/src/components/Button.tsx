/**
 * Button 컴포넌트
 * - variant: primary(파란색) | secondary(회색) | danger(빨간색) | ghost(테두리만)
 * - size: small | medium | large
 * - loading: 로딩 스피너 표시 + 클릭 비활성화
 * - disabled: 비활성화
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
  children: React.ReactNode
}

const sizeClass = {
  small: 'px-3 py-1.5 text-sm',
  medium: 'px-4 py-2 text-base',
  large: 'px-6 py-3 text-lg',
}

const variantClass = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 disabled:opacity-40',
}

function Button({
  size = 'medium',
  variant = 'primary',
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:cursor-not-allowed',
        sizeClass[size],
        variantClass[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button
