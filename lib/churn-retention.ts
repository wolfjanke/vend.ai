import { buildWhatsAppUrl } from '@/lib/whatsapp'
import type { PlanSlug, SubscriptionStatus } from '@/types'

/** WhatsApp do fundador — configurável via env (Vercel Production). */
export const FOUNDER_WHATSAPP =
  process.env.FOUNDER_WHATSAPP?.replace(/\D/g, '') ?? '5565999883143'

export const RETENTION_BONUS_DAYS = 30

export interface RetentionOfferContext {
  storeName: string
  plan: PlanSlug
  subscriptionStatus: SubscriptionStatus | null
  billingExempt?: boolean
  retentionBonusGrantedAt?: string | null
}

export function isRetentionOfferEligible(ctx: RetentionOfferContext): boolean {
  if (ctx.billingExempt) return false
  if (ctx.plan === 'free') return false
  if (ctx.subscriptionStatus === 'CANCELLED') return false
  if (ctx.retentionBonusGrantedAt) return false
  return true
}

/** Item na fila aguardando aprovação do superadmin. */
export function isRetentionQueuePending(row: {
  clickedAt?: string | null
  grantedAt?: string | null
  dismissedAt?: string | null
  subscriptionStatus?: string | null
  plan?: string
}): boolean {
  if (!row.clickedAt) return false
  if (row.grantedAt || row.dismissedAt) return false
  if (row.plan === 'free') return false
  if (row.subscriptionStatus === 'CANCELLED') return false
  return true
}

function planLabel(plan: PlanSlug): string {
  if (plan === 'free') return 'Grátis'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

/** Mensagem pré-preenchida ao abrir WhatsApp no fluxo de retenção. */
export function buildRetentionWhatsAppMessage(ctx: {
  storeName: string
  plan: PlanSlug
}): string {
  const loja = ctx.storeName.trim() || 'minha loja'
  return [
    'Oi! Eu ia cancelar minha assinatura do vendai.club — vi que dá pra ganhar +30 dias grátis em troca de um feedback rápido.',
    '',
    `Loja: ${loja}`,
    `Plano: ${planLabel(ctx.plan)}`,
    '',
    'Queria te contar o que não encaixou pra mim e ouvir sua visão sobre como melhorar. Podemos conversar por aqui?',
  ].join('\n')
}

export function buildRetentionWhatsAppUrl(ctx: {
  storeName: string
  plan: PlanSlug
}): string {
  return buildWhatsAppUrl(FOUNDER_WHATSAPP, buildRetentionWhatsAppMessage(ctx))
}

/**
 * Ao conceder +30 dias manualmente (superadmin ou script):
 * - TRIAL: somar 30 dias ao trial_ends_at restante (não reiniciar contagem).
 * - ACTIVE/OVERDUE: somar 30 dias ao subscription_ends_at e sync nextDueDate no Asaas.
 */
