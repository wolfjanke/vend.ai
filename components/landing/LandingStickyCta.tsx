'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/** Barra fixa de conversão no mobile — aparece após rolar o hero. */
export default function LandingStickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hero = document.querySelector('[data-landing-hero]')
    const finalCta = document.querySelector('[data-landing-final-cta]')

    function update() {
      const scrollY = window.scrollY
      const heroBottom = hero?.getBoundingClientRect().bottom ?? 400
      const pastHero = scrollY > 80 && heroBottom < 0

      let nearFinal = false
      if (finalCta) {
        const rect = finalCta.getBoundingClientRect()
        nearFinal = rect.top < window.innerHeight * 0.85
      }

      setVisible(pastHero && !nearFinal)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 md:hidden px-3 pt-2 border-t border-border bg-bg/95 backdrop-blur-md"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <Link
        href="/cadastro"
        className="shimmer font-syne font-bold w-full max-w-[calc(100vw-24px)] mx-auto flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-grad text-bg hover:opacity-90 transition-opacity"
      >
        Criar minha loja grátis
        <ArrowRight size={16} aria-hidden />
      </Link>
    </div>
  )
}
