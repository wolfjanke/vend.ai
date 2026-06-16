'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Tag,
  Megaphone,
  Palette,
  Settings,
  Wallet,
  ShoppingCart,
  Crown,
  type LucideIcon,
} from 'lucide-react'
import type { PlanSlug } from '@/types'

interface NavItem {
  href:     string
  label:    string
  Icon:     LucideIcon
  match:    'exact' | 'prefix'
  planOnly?: PlanSlug
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard',    label: 'Dashboard',  Icon: LayoutDashboard, match: 'exact' },
  { href: '/admin/pedidos',      label: 'Pedidos',    Icon: ShoppingBag,     match: 'prefix' },
  { href: '/admin/produtos',     label: 'Produtos',   Icon: Shirt,           match: 'prefix' },
  { href: '/admin/categorias',   label: 'Categorias', Icon: Tag,             match: 'exact' },
  { href: '/admin/marketing',    label: 'Marketing',  Icon: Megaphone,       match: 'exact' },
  { href: '/admin/aparencia',    label: 'Aparência',  Icon: Palette,         match: 'exact' },
  { href: '/admin/pagamentos',   label: 'Como receber', Icon: Wallet,           match: 'prefix' },
  { href: '/admin/pdv',          label: 'PDV',        Icon: ShoppingCart,    match: 'prefix', planOnly: 'loja' },
  { href: '/admin/plano',        label: 'Plano',      Icon: Crown,           match: 'exact' },
  { href: '/admin/configuracoes', label: 'Configurações', Icon: Settings, match: 'exact' },
]

function isActive(pathname: string, href: string, match: 'exact' | 'prefix') {
  if (match === 'exact') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface Props {
  newOrdersCount: number
  plan?: PlanSlug
}

export default function AdminSidebar({ newOrdersCount, plan = 'free' }: Props) {
  const pathname = usePathname() ?? ''

  const visibleItems = navItems.filter(item => !item.planOnly || item.planOnly === plan)

  return (
    <>
      <aside className="hidden md:flex w-52 xl:w-60 flex-col gap-1 p-4 border-r border-border min-h-[calc(100vh-64px)] sticky top-16">
        {visibleItems.map(({ href, label, Icon, match }) => {
          const active    = isActive(pathname, href, match)
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
    </>
  )
}
