import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'accent' | 'ghost' | 'danger' | 'grad'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white border-transparent hover:shadow-[0_4px_20px_var(--primary-glow)] hover:-translate-y-0.5',
  accent:  'bg-accent text-bg border-transparent hover:shadow-[0_4px_20px_var(--accent-glow)] hover:-translate-y-0.5',
  ghost:   'bg-transparent text-muted border-border hover:text-foreground hover:border-muted',
  danger:  'bg-warm/10 text-warm border-warm/30 hover:bg-warm/20',
  grad:    'bg-grad text-bg border-transparent hover:opacity-90 hover:-translate-y-0.5',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-[14px]',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-syne font-bold border transition-all',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? <span className="animate-pulse">…</span> : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
