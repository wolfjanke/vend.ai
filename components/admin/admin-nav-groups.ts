import {
  BarChart2,
  Bot,
  Wallet,
  Crown,
  LayoutDashboard,
  Megaphone,
  Monitor,
  Palette,
  Settings,
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
      { label: 'Produtos',   href: '/admin/produtos',   Icon: Shirt,    match: 'prefix' },
      { label: 'Categorias', href: '/admin/categorias', Icon: Tag,      match: 'exact' },
      { label: 'Aparência',  href: '/admin/aparencia',  Icon: Palette,  match: 'exact' },
      { label: 'Marketing',  href: '/admin/marketing',  Icon: Megaphone, match: 'exact' },
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
      { label: 'Assistente IA este mês', href: '/admin/dashboard#vi', Icon: Bot, match: 'exact' },
      { label: 'Plano',       href: '/admin/plano',        Icon: Crown,           match: 'exact' },
    ],
  },
  {
    id:    'config',
    label: 'Configurações',
    Icon:  Settings2,
    items: [
      { label: 'Configurações', href: '/admin/configuracoes', Icon: Settings,   match: 'exact' },
      { label: 'Como receber', href: '/admin/pagamentos', Icon: Wallet, match: 'prefix' },
      { label: 'Plano',         href: '/admin/plano',         Icon: Crown,      match: 'exact' },
    ],
  },
]

export function navItemPath(href: string): string {
  return href.split('#')[0]
}

export function isNavItemActive(pathname: string, href: string, match: 'exact' | 'prefix'): boolean {
  const path = navItemPath(href)
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
