'use client'

import { useEffect, useRef, useState } from 'react'

interface NumberCounterProps {
  target: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}

export default function NumberCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 1800,
  className = '',
}: NumberCounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()

          const tick = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }

          requestAnimationFrame(tick)
          observer.unobserve(el)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString('pt-BR')}{suffix}
    </span>
  )
}
