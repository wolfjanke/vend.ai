'use client'

import { useEffect, useState } from 'react'

export const CONFIG_SECTIONS = [
  { id: 'config-loja',    label: 'Loja' },
  { id: 'config-contato', label: 'Contato' },
  { id: 'config-venda',   label: 'Venda' },
  { id: 'config-vi',      label: 'Assistente IA' },
  { id: 'config-conta',   label: 'Conta' },
] as const

export type ConfigSectionId = (typeof CONFIG_SECTIONS)[number]['id']

export default function ConfigSectionNav() {
  const [active, setActive] = useState<ConfigSectionId>(CONFIG_SECTIONS[0].id)

  useEffect(() => {
    const elements = CONFIG_SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    if (!elements.length) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const id = visible[0]?.target.id as ConfigSectionId | undefined
        if (id && CONFIG_SECTIONS.some(s => s.id === id)) setActive(id)
      },
      { rootMargin: '-32% 0px -52% 0px', threshold: [0, 0.12, 0.3] },
    )

    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function scrollToSection(id: ConfigSectionId) {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="Seções de configurações"
      className="sticky top-16 z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8 py-2.5 mb-4 bg-bg/95 backdrop-blur-md border-b border-border"
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5 min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CONFIG_SECTIONS.map(section => {
          const isActive = active === section.id
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`shrink-0 min-h-[44px] px-4 rounded-full border text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface2 text-muted hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {section.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
