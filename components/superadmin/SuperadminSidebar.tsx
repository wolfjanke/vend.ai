'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SUPERADMIN_NAV, isSuperadminNavActive } from './superadmin-nav-items'
import { superadminActive, superadminInactive } from '@/lib/superadmin-ui'
import { useRetentionPendingCount } from '@/hooks/useRetentionPendingCount'

export default function SuperadminSidebar() {
  const pathname = usePathname() ?? ''
  const retentionPending = useRetentionPendingCount(pathname)

  return (
    <aside className="hidden md:flex w-52 xl:w-60 flex-col gap-1 p-4 border-r border-border min-h-[calc(100vh-64px)] sticky top-16">
      {SUPERADMIN_NAV.map(({ href, label, Icon }) => {
        const active = isSuperadminNavActive(pathname, href)
        const showBadge = href === '/superadmin/retencao' && retentionPending > 0
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all min-w-0 min-h-[44px] ${
              active ? superadminActive : superadminInactive
            }`}
          >
            <Icon size={18} className={`shrink-0 ${active ? 'text-warm' : ''}`} aria-hidden />
            <span className="truncate flex-1">{label}</span>
            {showBadge && (
              <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-warm text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {retentionPending > 99 ? '99+' : retentionPending}
              </span>
            )}
          </Link>
        )
      })}
    </aside>
  )
}
