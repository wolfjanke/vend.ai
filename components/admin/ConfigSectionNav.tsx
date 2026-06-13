'use client'

export const CONFIG_SECTIONS = [
  { id: 'config-loja',  label: 'Informações da loja' },
  { id: 'config-venda', label: 'Venda' },
  { id: 'config-vi',    label: 'Assistente IA' },
  { id: 'config-conta', label: 'Conta' },
] as const

export type ConfigSectionId = (typeof CONFIG_SECTIONS)[number]['id']

interface Props {
  active:           ConfigSectionId
  onChange:         (id: ConfigSectionId) => void
  /** Desktop: Vi fica no painel lateral — oculta a aba */
  hideViOnDesktop?: boolean
}

export default function ConfigSectionNav({ active, onChange, hideViOnDesktop = false }: Props) {
  return (
    <nav
      aria-label="Seções de configurações"
      className="sticky top-16 z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8 py-2.5 mb-4 bg-bg/95 backdrop-blur-md border-b border-border"
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5 min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CONFIG_SECTIONS.map(section => {
          const isActive = active === section.id
          const hideOnDesktop = hideViOnDesktop && section.id === 'config-vi'
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onChange(section.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`shrink-0 min-h-[44px] px-4 rounded-full border text-sm font-semibold transition-colors ${
                hideOnDesktop ? 'lg:hidden' : ''
              } ${
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
