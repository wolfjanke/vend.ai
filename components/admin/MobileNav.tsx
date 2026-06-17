'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import type { PlanSlug } from '@/types'
import NavBottomSheet from './NavBottomSheet'
import {
  type AdminNavGroup,
  isNavGroupActive,
  visibleNavGroups,
} from './admin-nav-groups'

type Props = {
  newOrdersCount: number
  plan?:            PlanSlug
  isDemo?:          boolean
}

export default function MobileNav({ newOrdersCount, plan = 'free', isDemo = false }: Props) {
  const pathname = usePathname() ?? ''
  const [openGroup, setOpenGroup] = useState<AdminNavGroup | null>(null)
  const groups = visibleNavGroups(plan, isDemo)

  function openSheet(group: AdminNavGroup) {
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
        aria-label="Navegação principal"
      >
        {groups.map(group => {
          const active = isNavGroupActive(pathname, group, plan)
          const isSheetOpen = openGroup?.id === group.id
          const GroupIcon = group.Icon
          const showGestaoDot =
            group.id === 'gestao' && newOrdersCount > 0

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => openSheet(group)}
              aria-expanded={isSheetOpen}
              aria-controls="admin-nav-sheet-title"
              className={`relative flex flex-col items-center justify-center gap-1 min-h-[64px] w-full transition-colors border-t-2 ${
                active || isSheetOpen
                  ? 'text-primary border-primary'
                  : 'text-muted border-transparent'
              }`}
            >
              {showGestaoDot && (
                <span
                  className="absolute top-2 right-[calc(50%-18px)] w-2 h-2 rounded-full bg-warm"
                  aria-label={`${newOrdersCount} pedidos novos`}
                />
              )}
              <GroupIcon size={24} className="shrink-0" aria-hidden />
              <span className="text-[11px] font-medium leading-none">{group.label}</span>
            </button>
          )
        })}
      </nav>

      <NavBottomSheet
        group={openGroup}
        isOpen={openGroup != null}
        onClose={closeSheet}
        newOrdersCount={newOrdersCount}
      />
    </>
  )
}
