import type { PlanSlug } from '@/types'

/** PDV disponível apenas no plano Loja (mesma regra da UI em app/admin/pdv/page.tsx). */
export function canUsePdv(plan: PlanSlug | string | null | undefined): boolean {
  return plan === 'loja'
}
