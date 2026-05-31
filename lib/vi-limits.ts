import { sql } from '@/lib/db'
import type { PlanSlug, StoreSettings } from '@/types'

/** Mensagens Vi por mês conforme plano (0 = bloqueado). */
export const VI_MONTHLY_BY_PLAN: Record<PlanSlug, number> = {
  free:    0,
  starter: 500,
  pro:     5_000,
  loja:    50_000,
}

const IP_LIMIT = 30
const IP_WINDOW_MS = 60_000

export function viIpLimit() {
  return { limit: IP_LIMIT, windowMs: IP_WINDOW_MS }
}

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export async function checkAndIncrementViUsage(
  storeId: string,
  plan: PlanSlug,
  settings: StoreSettings | null | undefined,
): Promise<{ allowed: boolean; reason?: 'plan' | 'monthly' | 'daily' }> {
  const monthlyLimit = VI_MONTHLY_BY_PLAN[plan] ?? 0
  if (monthlyLimit <= 0) {
    return { allowed: false, reason: 'plan' }
  }

  const dailyCap = settings?.viDailyLimit
  if (dailyCap != null && dailyCap > 0) {
    const dk = `day:${dayKey()}`
    const dayRows = await sql`
      SELECT msg_count FROM vi_usage
      WHERE store_id = ${storeId} AND period_key = ${dk}
      LIMIT 1
    `
    const dayCount = Number(dayRows[0]?.msg_count ?? 0)
    if (dayCount >= dailyCap) {
      return { allowed: false, reason: 'daily' }
    }
    await sql`
      INSERT INTO vi_usage (store_id, period_key, msg_count)
      VALUES (${storeId}, ${dk}, 1)
      ON CONFLICT (store_id, period_key)
      DO UPDATE SET msg_count = vi_usage.msg_count + 1, updated_at = NOW()
    `
  }

  const mk = `month:${monthKey()}`
  const rows = await sql`
    SELECT msg_count FROM vi_usage
    WHERE store_id = ${storeId} AND period_key = ${mk}
    LIMIT 1
  `
  const count = Number(rows[0]?.msg_count ?? 0)
  if (count >= monthlyLimit) {
    return { allowed: false, reason: 'monthly' }
  }

  await sql`
    INSERT INTO vi_usage (store_id, period_key, msg_count)
    VALUES (${storeId}, ${mk}, 1)
    ON CONFLICT (store_id, period_key)
    DO UPDATE SET msg_count = vi_usage.msg_count + 1, updated_at = NOW()
  `

  return { allowed: true }
}
