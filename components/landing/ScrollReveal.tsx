'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'none'
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    document.documentElement.classList.add('js')

    const reveal = () => {
      setTimeout(() => el.classList.add('is-visible'), delay)
    }

    // Já na viewport no carregamento (ex.: refresh no meio da página)
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal()
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      reveal()
      return
    }

    const fallback = window.setTimeout(reveal, 2_500)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.clearTimeout(fallback)
          reveal()
          observer.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
    )

    observer.observe(el)
    return () => {
      window.clearTimeout(fallback)
      observer.disconnect()
    }
  }, [delay])

  const dirClass =
    direction === 'left'
      ? 'reveal-left'
      : direction === 'right'
        ? 'reveal-right'
        : direction === 'none'
          ? 'reveal-none'
          : 'reveal'

  return (
    <div ref={ref} className={`${dirClass} ${className}`}>
      {children}
    </div>
  )
}
