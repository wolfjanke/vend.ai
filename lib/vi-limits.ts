import { sql } from '@/lib/db'
import { getPlan, type PlanSlug } from '@/lib/plans'
import { GEMINI_MODELS } from '@/lib/gemini'
import { digitsOnly } from '@/lib/masks'
import { getStorePlanContext } from '@/lib/store-plan-access'

const IP_LIMIT = 30
const IP_WINDOW_MS = 60_000

export function viIpLimit() {
  return { limit: IP_LIMIT, windowMs: IP_WINDOW_MS }
}

export const VI_WHATSAPP_REDIRECT_MESSAGE =
  'Que ótimo você chegou até aqui!\nNossa equipe vai adorar te atender pessoalmente.\nFala com a gente pelo WhatsApp.'

type StoreUsageRow = {
  id:                    string
  plan:                  string
  whatsapp:              string
  vi_messages_used:      number
  vi_messages_reset_at:  string
  vi_overage_messages:   number
  vi_daily_limit:        number | null
}

function startOfUtcMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

function monthChanged(resetAt: string | Date | null): boolean {
  if (!resetAt) return true
  const r = new Date(resetAt)
  const now = new Date()
  return r.getUTCFullYear() !== now.getUTCFullYear() || r.getUTCMonth() !== now.getUTCMonth()
}

function dayKey(d = new Date()): string {
  return `day:${d.toISOString().slice(0, 10)}`
}

async function loadStoreUsage(storeId: string): Promise<(StoreUsageRow & { is_demo?: boolean; slug?: string }) | null> {
  const rows = await sql`
    SELECT id, plan, whatsapp, vi_messages_used, vi_messages_reset_at,
           vi_overage_messages, vi_daily_limit, is_demo, slug
    FROM stores WHERE id = ${storeId} LIMIT 1
  `
  return (rows[0] as (StoreUsageRow & { is_demo?: boolean; slug?: string }) | undefined) ?? null
}

async function resetMonthlyIfNeeded(storeId: string, resetAt: string | null): Promise<void> {
  if (!monthChanged(resetAt)) return
  await sql`
    UPDATE stores SET
      vi_messages_used = 0,
      vi_messages_reset_at = NOW(),
      vi_overage_messages = 0
    WHERE id = ${storeId}
  `
}

export async function checkViDailyLimit(storeId: string): Promise<boolean> {
  const store = await loadStoreUsage(storeId)
  if (!store) return false
  const cap = store.vi_daily_limit
  if (cap == null || cap <= 0) return true

  const dk = dayKey()
  const dayRows = await sql`
    SELECT msg_count FROM vi_usage
    WHERE store_id = ${storeId} AND period_key = ${dk}
    LIMIT 1
  `
  const count = Number(dayRows[0]?.msg_count ?? 0)
  return count < cap
}

export async function incrementViDailyCount(storeId: string): Promise<void> {
  const store = await loadStoreUsage(storeId)
  if (!store?.vi_daily_limit || store.vi_daily_limit <= 0) return

  const dk = dayKey()
  await sql`
    INSERT INTO vi_usage (store_id, period_key, msg_count)
    VALUES (${storeId}, ${dk}, 1)
    ON CONFLICT (store_id, period_key)
    DO UPDATE SET msg_count = vi_usage.msg_count + 1, updated_at = NOW()
  `
}

export async function checkViLimit(storeId: string): Promise<{
  allowed:     boolean
  remaining:   number
  isOverage:   boolean
  plan:        PlanSlug
  used:        number
  limit:       number
  whatsapp:    string
  redirect?:   boolean
}> {
  const store = await loadStoreUsage(storeId)
  if (!store) {
    return { allowed: false, remaining: 0, isOverage: false, plan: 'free', used: 0, limit: 0, whatsapp: '' }
  }

  const plan = (store.plan ?? 'free') as PlanSlug
  const planCtx = getStorePlanContext(store)

  await resetMonthlyIfNeeded(storeId, store.vi_messages_reset_at)
  const fresh = await loadStoreUsage(storeId)
  const used = Number(fresh?.vi_messages_used ?? 0)
  const limit = planCtx.viMessagesLimit
  const remaining = Math.max(0, limit - used)

  if (used >= limit) {
    if (planCtx.isDemo) {
      return {
        allowed:   true,
        remaining: 999_999,
        isOverage: false,
        plan:      planCtx.plan,
        used,
        limit,
        whatsapp:  fresh?.whatsapp ?? store.whatsapp,
      }
    }
    if (plan === 'free') {
      return {
        allowed:   false,
        remaining: 0,
        isOverage: false,
        plan,
        used,
        limit,
        whatsapp:  fresh?.whatsapp ?? store.whatsapp,
        redirect:  true,
      }
    }
    return {
      allowed:   true,
      remaining: 0,
      isOverage: true,
      plan,
      used,
      limit,
      whatsapp: fresh?.whatsapp ?? store.whatsapp,
    }
  }

  return {
    allowed:   true,
    remaining,
    isOverage: false,
    plan,
    used,
    limit,
    whatsapp: fresh?.whatsapp ?? store.whatsapp,
  }
}

export async function incrementViMessage(storeId: string, isOverage: boolean): Promise<void> {
  if (isOverage) {
    await sql`
      UPDATE stores SET
        vi_messages_used = vi_messages_used + 1,
        vi_overage_messages = vi_overage_messages + 1
      WHERE id = ${storeId}
    `
  } else {
    await sql`
      UPDATE stores SET vi_messages_used = vi_messages_used + 1
      WHERE id = ${storeId}
    `
  }
}

export function buildWhatsAppRedirectUrl(whatsapp: string): string {
  const digits = digitsOnly(whatsapp)
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountry}`
}

export function viModelForPlan(plan: PlanSlug): string {
  return plan === 'free' ? GEMINI_MODELS.stockSearch : GEMINI_MODELS.viChat
}

export function viStreamsForPlan(plan: PlanSlug): boolean {
  return plan !== 'free'
}

/** Uso para dashboard (após reset mensal). */
export async function getViUsageStats(storeId: string): Promise<{
  used:      number
  limit:     number
  overage:   number
  plan:      PlanSlug
  percent:   number
  daysReset: number
}> {
  const store = await loadStoreUsage(storeId)
  const plan = (store?.plan ?? 'free') as PlanSlug
  const planDef = getPlan(plan)
  if (store) await resetMonthlyIfNeeded(storeId, store.vi_messages_reset_at)
  const fresh = await loadStoreUsage(storeId)
  const used = Number(fresh?.vi_messages_used ?? 0)
  const limit = planDef.viMessagesLimit
  const overage = Number(fresh?.vi_overage_messages ?? 0)
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const daysReset = Math.max(0, Math.ceil((nextMonth.getTime() - now.getTime()) / 86_400_000))

  return { used, limit, overage, plan, percent, daysReset }
}
