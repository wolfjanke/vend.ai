'use client'

import AdminStickySectionNav, { adminSectionNavButtonClass } from '@/components/admin/AdminStickySectionNav'

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
    <AdminStickySectionNav ariaLabel="Seções de configurações" activeKey={active}>
      {CONFIG_SECTIONS.map(section => {
        const isActive = active === section.id
        const hideOnDesktop = hideViOnDesktop && section.id === 'config-vi'
        return (
          <button
            key={section.id}
            type="button"
            data-nav-key={section.id}
            onClick={() => onChange(section.id)}
            aria-current={isActive ? 'true' : undefined}
            className={adminSectionNavButtonClass(
              isActive,
              hideOnDesktop ? 'lg:hidden' : '',
            )}
          >
            {section.label}
          </button>
        )
      })}
    </AdminStickySectionNav>
  )
}
