'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import type { AdminNavGroup } from './admin-nav-groups'
import { isNavItemActive } from './admin-nav-groups'

type Props = {
  group:           AdminNavGroup | null
  isOpen:          boolean
  onClose:         () => void
  newOrdersCount?: number
}

export default function NavBottomSheet({
  group,
  isOpen,
  onClose,
  newOrdersCount = 0,
}: Props) {
  const pathname = usePathname() ?? ''
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current == null) return
      const deltaY = e.touches[0].clientY - touchStartY.current
      if (deltaY > 80) {
        touchStartY.current = null
        onClose()
      }
    },
    [onClose],
  )

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null
  }, [])

  if (!group) return null

  const GroupIcon = group.Icon

  return (
    <>
      <button
        type="button"
        aria-label="Fechar menu"
        className={`fixed inset-0 z-[60] bg-bg/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-nav-sheet-title"
        aria-hidden={!isOpen}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed left-0 right-0 z-[70] md:hidden max-w-[100vw] border border-border border-b-0 bg-surface rounded-t-[20px] shadow-[0_-12px_40px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
        style={{
          bottom:    'calc(64px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: '8px',
        }}
      >
        <div
          className="w-10 h-1 rounded-full bg-border mx-auto mt-3 mb-4 shrink-0"
          aria-hidden
        />

        <div className="flex items-center gap-2.5 px-5 pb-3 border-b border-border min-w-0">
          <GroupIcon size={20} className="text-primary shrink-0" aria-hidden />
          <h2
            id="admin-nav-sheet-title"
            className="font-syne font-bold text-base text-foreground truncate"
          >
            {group.label}
          </h2>
        </div>

        <div className="py-2 max-h-[min(50vh,calc(100dvh-180px))] overflow-y-auto">
          {group.items.map(item => {
            const active = isNavItemActive(pathname, item.href, item.match)
            const ItemIcon = item.Icon
            const showBadge = item.href.startsWith('/admin/pedidos') && newOrdersCount > 0

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-5 py-3.5 min-h-[52px] text-sm transition-colors min-w-0 no-underline border-l-2 ${
                  active
                    ? 'text-primary bg-primary/10 border-primary font-semibold'
                    : 'text-muted border-transparent hover:text-foreground hover:bg-surface2/80 font-normal'
                }`}
              >
                <ItemIcon size={20} className="shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center tabular-nums">
                    {newOrdersCount > 99 ? '99+' : newOrdersCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
