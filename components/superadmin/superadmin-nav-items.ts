import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Timer,
  Activity,
  Crown,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type SuperadminNavItem = {
  href:  string
  label: string
  Icon:  LucideIcon
}

export const SUPERADMIN_NAV: SuperadminNavItem[] = [
  { href: '/superadmin/dashboard',     label: 'Dashboard',      Icon: LayoutDashboard },
  { href: '/superadmin/clientes',      label: 'Clientes',       Icon: Users },
  { href: '/superadmin/financeiro',    label: 'Financeiro',     Icon: TrendingUp },
  { href: '/superadmin/trials',        label: 'Trials',         Icon: Timer },
  { href: '/superadmin/engajamento',   label: 'Engajamento',    Icon: Activity },
  { href: '/superadmin/planos',        label: 'Planos',         Icon: Crown },
  { href: '/superadmin/logs',          label: 'Logs',           Icon: ScrollText },
  { href: '/superadmin/configuracoes', label: 'Configurações',  Icon: Settings },
]

export function isSuperadminNavActive(pathname: string, href: string): boolean {
  if (href === '/superadmin/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}
