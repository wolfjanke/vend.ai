'use client'

import { LOJA_SECTIONS, type LojaSectionId } from '@/lib/admin-loja-sections'
import AdminStickySectionNav, { adminSectionNavButtonClass } from '@/components/admin/AdminStickySectionNav'

interface Props {
  active:   LojaSectionId
  onChange: (id: LojaSectionId) => void
}

export default function LojaSectionNav({ active, onChange }: Props) {
  return (
    <AdminStickySectionNav ariaLabel="Seções da minha loja" activeKey={active}>
      {LOJA_SECTIONS.map(section => {
        const isActive = active === section.id
        return (
          <button
            key={section.id}
            type="button"
            data-nav-key={section.id}
            onClick={() => onChange(section.id)}
            aria-current={isActive ? 'true' : undefined}
            title={section.description}
            className={adminSectionNavButtonClass(isActive)}
          >
            {section.label}
          </button>
        )
      })}
    </AdminStickySectionNav>
  )
}
