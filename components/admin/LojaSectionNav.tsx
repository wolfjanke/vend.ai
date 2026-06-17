'use client'

import { LOJA_SECTIONS, type LojaSectionId } from '@/lib/admin-loja-sections'

interface Props {
  active:   LojaSectionId
  onChange: (id: LojaSectionId) => void
}

export default function LojaSectionNav({ active, onChange }: Props) {
  return (
    <nav
      aria-label="Seções da minha loja"
      className="sticky top-16 z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8 py-2.5 mb-4 bg-bg/95 backdrop-blur-md border-b border-border"
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5 min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LOJA_SECTIONS.map(section => {
          const isActive = active === section.id
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onChange(section.id)}
              aria-current={isActive ? 'true' : undefined}
              title={section.description}
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
