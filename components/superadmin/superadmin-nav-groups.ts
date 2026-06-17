import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Timer,
  Activity,
  Crown,
  ScrollText,
  Settings,
  Settings2,
  BarChart2,
  type LucideIcon,
} from 'lucide-react'
import { SUPERADMIN_NAV } from './superadmin-nav-items'

export type SuperadminNavSheetItem = {
  label: string
  href:  string
  Icon:  LucideIcon
}

export type SuperadminNavGroup = {
  id:    string
  label: string
  Icon:  LucideIcon
  items: SuperadminNavSheetItem[]
}

const navByHref = Object.fromEntries(SUPERADMIN_NAV.map(item => [item.href, item]))

export const SUPERADMIN_NAV_GROUPS: SuperadminNavGroup[] = [
  {
    id:    'visao',
    label: 'Visão',
    Icon:  BarChart2,
    items: [
      navByHref['/superadmin/dashboard'],
      navByHref['/superadmin/clientes'],
      navByHref['/superadmin/financeiro'],
    ],
  },
  {
    id:    'saude',
    label: 'Saúde',
    Icon:  Activity,
    items: [
      navByHref['/superadmin/trials'],
      navByHref['/superadmin/engajamento'],
      navByHref['/superadmin/retencao'],
    ],
  },
  {
    id:    'sistema',
    label: 'Sistema',
    Icon:  Settings2,
    items: [
      navByHref['/superadmin/planos'],
      navByHref['/superadmin/logs'],
      navByHref['/superadmin/configuracoes'],
    ],
  },
]

export function isSuperadminNavItemActive(pathname: string, href: string): boolean {
  if (href === '/superadmin/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isSuperadminNavGroupActive(pathname: string, group: SuperadminNavGroup): boolean {
  return group.items.some(item => isSuperadminNavItemActive(pathname, item.href))
}
