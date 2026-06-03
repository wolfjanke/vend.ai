import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PLANS, type PlanSlug } from '@/lib/plans'

export { getSuperadminEmails, isSuperadminEmail } from '@/lib/superadmin-allowlist'
import { isSuperadminEmail } from '@/lib/superadmin-allowlist'

export async function requireSuperadmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!session || !isSuperadminEmail(email)) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, error: null }
}

export function mrrFromPlan(plan: string): number {
  const slug = (plan in PLANS ? plan : 'free') as PlanSlug
  return PLANS[slug]?.price ?? 0
}

export function formatBrl(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const SUPERADMIN_MENU = [
  { label: 'Dashboard', href: '/superadmin/dashboard', icon: 'LayoutDashboard' as const },
  { label: 'Clientes', href: '/superadmin/clientes', icon: 'Users' as const },
  { label: 'Financeiro', href: '/superadmin/financeiro', icon: 'TrendingUp' as const },
  { label: 'Trials', href: '/superadmin/trials', icon: 'Timer' as const },
  { label: 'Engajamento', href: '/superadmin/engajamento', icon: 'Activity' as const },
  { label: 'Planos', href: '/superadmin/planos', icon: 'Crown' as const },
  { label: 'Logs', href: '/superadmin/logs', icon: 'ScrollText' as const },
  { label: 'Configurações', href: '/superadmin/configuracoes', icon: 'Settings' as const },
]
