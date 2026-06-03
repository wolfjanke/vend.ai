'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { SUPERADMIN_NAV, isSuperadminNavActive } from './superadmin-nav-items'

export default function SuperadminMobileNav() {
  const pathname = usePathname() ?? ''
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-4 right-4 z-50 min-h-[44px] min-w-[44px] rounded-full bg-[#FF6B6B] text-white shadow-lg flex items-center justify-center"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/60 max-w-[100vw]"
          onClick={() => setOpen(false)}
          role="presentation"
        />
      )}

      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-[61] bg-surface border-t border-border rounded-t-2xl p-4 max-w-[100vw] transition-transform ${
          open ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        aria-label="Menu superadmin"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-syne font-bold text-sm">Wolf Hub Admin</span>
          <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
          {SUPERADMIN_NAV.map(({ href, label, Icon }) => {
            const active = isSuperadminNavActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm min-h-[44px] min-w-0 ${
                  active ? 'bg-[#FF6B6B]/15 border border-[#FF6B6B]/40' : 'bg-surface2 border border-border'
                }`}
              >
                <Icon size={16} className="shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
