'use client'

import type { BannerMotion } from '@/types'

interface Props {
  text:     string
  motion?:  BannerMotion
  variant?: 'store' | 'admin-preview'
  swapIn?:   boolean
}

export default function BannerStrip({
  text,
  motion = 'none',
  variant = 'store',
  swapIn = false,
}: Props) {
  const textTrim = text.trim()
  if (!textTrim) return null

  const accentClass = variant === 'store' ? 'banner-strip-accent' : 'text-primary'
  const pulseOn = motion === 'pulse'

  const shellClass =
    variant === 'admin-preview'
      ? 'px-3 py-2.5 border border-primary/25 bg-primary/10 rounded-xl'
      : `px-3 py-2.5 border-b overflow-hidden${swapIn ? ' banner-swap-in' : ''}`

  const shellStyle =
    variant === 'store'
      ? {
          background: 'var(--theme-primary-surface)',
          borderColor:  'var(--theme-primary-border)',
        }
      : undefined

  return (
    <div className={shellClass} style={shellStyle}>
      <div className={variant === 'store' ? 'mx-auto w-full max-w-5xl min-w-0' : 'w-full min-w-0'}>
        <p
          className={`text-sm sm:text-base font-semibold text-center break-words min-w-0 tracking-wide ${accentClass} ${
            pulseOn ? 'banner-motion-pulse' : ''
          }`}
        >
          {textTrim}
        </p>
      </div>
    </div>
  )
}
