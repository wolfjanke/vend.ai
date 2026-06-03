'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SUPERADMIN_NAV, isSuperadminNavActive } from './superadmin-nav-items'

export default function SuperadminSidebar() {
  const pathname = usePathname() ?? ''

  return (
    <aside className="hidden md:flex w-52 xl:w-60 flex-col gap-1 p-4 border-r border-border min-h-[calc(100vh-64px)] sticky top-16">
      {SUPERADMIN_NAV.map(({ href, label, Icon }) => {
        const active = isSuperadminNavActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all min-w-0 min-h-[44px] ${
              active
                ? 'bg-[#FF6B6B]/15 text-foreground border border-[#FF6B6B]/40'
                : 'text-muted hover:text-foreground hover:bg-surface2 border border-transparent'
            }`}
          >
            <Icon size={18} className="shrink-0" style={{ color: active ? '#FF6B6B' : undefined }} aria-hidden />
            <span className="truncate flex-1">{label}</span>
          </Link>
        )
      })}
    </aside>
  )
}
