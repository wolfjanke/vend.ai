'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Tag,
  Megaphone,
  Settings,
  type LucideIcon,
} from 'lucide-react'

const navItems: Array<{
  href: string
  label: string
  Icon: LucideIcon
  match: 'exact' | 'prefix'
}> = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard, match: 'exact' },
  { href: '/admin/pedidos', label: 'Pedidos', Icon: ShoppingBag, match: 'prefix' },
  { href: '/admin/produtos', label: 'Produtos', Icon: Shirt, match: 'prefix' },
  { href: '/admin/categorias', label: 'Categorias', Icon: Tag, match: 'exact' },
  { href: '/admin/marketing', label: 'Marketing', Icon: Megaphone, match: 'exact' },
  { href: '/admin/configuracoes', label: 'Config', Icon: Settings, match: 'exact' },
]

function isActive(pathname: string, href: string, match: 'exact' | 'prefix') {
  if (match === 'exact') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface Props {
  newOrdersCount: number
}

export default function AdminSidebar({ newOrdersCount }: Props) {
  const pathname = usePathname() ?? ''

  return (
    <>
      <aside className="hidden md:flex w-52 flex-col gap-1 p-4 border-r border-border min-h-[calc(100vh-64px)] sticky top-16">
        {navItems.map(({ href, label, Icon, match }) => {
          const active = isActive(pathname, href, match)
          const showBadge = href === '/admin/pedidos' && newOrdersCount > 0
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all min-w-0 ${
                active
                  ? 'bg-surface2 text-foreground border border-primary/30'
                  : 'text-muted hover:text-foreground hover:bg-surface2 border border-transparent'
              }`}
            >
              <Icon size={18} className="shrink-0" aria-hidden />
              <span className="truncate flex-1">{label}</span>
              {showBadge && (
                <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center tabular-nums">
                  {newOrdersCount > 99 ? '99+' : newOrdersCount}
                </span>
              )}
            </Link>
          )
        })}
      </aside>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border flex max-w-[100vw]"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        {navItems.map(({ href, label, Icon, match }) => {
          const active = isActive(pathname, href, match)
          const showBadge = href === '/admin/pedidos' && newOrdersCount > 0
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-0.5 text-[10px] sm:text-xs transition-colors min-w-0 border-t-2 ${
                active ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-foreground'
              }`}
            >
              <span className="relative">
                <Icon size={20} className="shrink-0" aria-hidden />
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-primary text-[8px] font-bold text-white flex items-center justify-center">
                    {newOrdersCount > 9 ? '9+' : newOrdersCount}
                  </span>
                )}
              </span>
              <span className="truncate w-full text-center leading-tight">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
