import { type InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?:  string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-4 py-3 bg-surface2 border rounded-xl text-foreground text-sm outline-none transition-all',
            'placeholder:text-muted',
            error
              ? 'border-warm focus:border-warm focus:shadow-[0_0_0_3px_var(--warm-dim)]'
              : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-warm">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
