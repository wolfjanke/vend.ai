import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PLANS, type PlanSlug } from '@/lib/plans'

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
