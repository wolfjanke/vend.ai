import {
  BarChart2,
  Bot,
  Wallet,
  Crown,
  LayoutDashboard,
  Monitor,
  Settings2,
  Shirt,
  ShoppingBag,
  Store,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import type { PlanSlug } from '@/types'

export type AdminNavSheetItem = {
  label:    string
  href:     string
  Icon:     LucideIcon
  match:    'exact' | 'prefix'
  planOnly?: PlanSlug
}

export type AdminNavGroup = {
  id:     string
  label:  string
  Icon:   LucideIcon
  items:  AdminNavSheetItem[]
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id:    'loja',
    label: 'Loja',
    Icon:  Store,
    items: [
      { label: 'Produtos',    href: '/admin/produtos',   Icon: Shirt, match: 'prefix' },
      { label: 'Categorias',  href: '/admin/categorias', Icon: Tag,   match: 'exact' },
      { label: 'Minha loja',  href: '/admin/loja',       Icon: Store, match: 'prefix' },
    ],
  },
  {
    id:    'gestao',
    label: 'Gestão',
    Icon:  BarChart2,
    items: [
      { label: 'Dashboard',   href: '/admin/dashboard',    Icon: LayoutDashboard, match: 'exact' },
      { label: 'Pedidos',     href: '/admin/pedidos',      Icon: ShoppingBag,     match: 'prefix' },
      { label: 'PDV',         href: '/admin/pdv',          Icon: Monitor,         match: 'prefix', planOnly: 'loja' },
      { label: 'Assistente de IA', href: '/admin/loja?secao=vi', Icon: Bot, match: 'prefix' },
    ],
  },
  {
    id:    'conta',
    label: 'Conta',
    Icon:  Settings2,
    items: [
      { label: 'Como receber', href: '/admin/pagamentos', Icon: Wallet, match: 'prefix' },
      { label: 'Plano',        href: '/admin/plano',      Icon: Crown,  match: 'exact' },
    ],
  },
]

export function navItemPath(href: string): string {
  return href.split('#')[0].split('?')[0]
}

export function isNavItemActive(pathname: string, href: string, match: 'exact' | 'prefix'): boolean {
  const path = navItemPath(href)
  if (path === '/admin/loja') {
    return pathname === '/admin/loja' || pathname.startsWith('/admin/loja/')
  }
  if (match === 'exact') return pathname === path
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function isNavGroupActive(pathname: string, group: AdminNavGroup, plan: PlanSlug): boolean {
  return group.items
    .filter(item => !item.planOnly || item.planOnly === plan)
    .some(item => isNavItemActive(pathname, item.href, item.match))
}

export function visibleNavGroups(plan: PlanSlug, isDemo = false): AdminNavGroup[] {
  return ADMIN_NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(
      item => !item.planOnly || item.planOnly === plan || (isDemo && item.planOnly === 'loja'),
    ),
  })).filter(group => group.items.length > 0)
}
