'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import SuperadminNavBottomSheet from './SuperadminNavBottomSheet'
import {
  type SuperadminNavGroup,
  SUPERADMIN_NAV_GROUPS,
  isSuperadminNavGroupActive,
} from './superadmin-nav-groups'

export default function SuperadminMobileNav() {
  const pathname = usePathname() ?? ''
  const [openGroup, setOpenGroup] = useState<SuperadminNavGroup | null>(null)

  function openSheet(group: SuperadminNavGroup) {
    setOpenGroup(prev => (prev?.id === group.id ? null : group))
  }

  function closeSheet() {
    setOpenGroup(null)
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border grid grid-cols-3 max-w-[100vw]"
        style={{
          height:        '64px',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="Navegação superadmin"
      >
        {SUPERADMIN_NAV_GROUPS.map(group => {
          const active = isSuperadminNavGroupActive(pathname, group)
          const isSheetOpen = openGroup?.id === group.id
          const GroupIcon = group.Icon

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => openSheet(group)}
              aria-expanded={isSheetOpen}
              aria-controls="superadmin-nav-sheet-title"
              className={`relative flex flex-col items-center justify-center gap-1 min-h-[64px] w-full transition-colors border-t-2 ${
                active || isSheetOpen
                  ? 'text-warm border-warm'
                  : 'text-muted border-transparent'
              }`}
            >
              <GroupIcon size={24} className="shrink-0" aria-hidden />
              <span className="text-[11px] font-medium leading-none">{group.label}</span>
            </button>
          )
        })}
      </nav>

      <SuperadminNavBottomSheet
        group={openGroup}
        isOpen={openGroup != null}
        onClose={closeSheet}
      />
    </>
  )
}
