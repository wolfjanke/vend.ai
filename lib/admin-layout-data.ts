import { cache } from 'react'
import { sql } from '@/lib/db'
import { getStorePlanContext } from '@/lib/store-plan-access'

export type AdminShellData = {
  store: { name: string; slug: string; plan?: string; isDemo?: boolean } | undefined
  newOrdersCount: number
}

/** Dados do header/sidebar — uma ida ao banco por navegação no admin. */
export const getAdminShellData = cache(async (storeId: string): Promise<AdminShellData> => {
  const [storeRows, countRows] = await Promise.all([
    sql`SELECT name, slug, plan, is_demo FROM stores WHERE id = ${storeId} LIMIT 1`,
    sql`
      SELECT COUNT(*)::int as c FROM orders
      WHERE store_id = ${storeId} AND status = 'NOVO'
    `,
  ])
  const raw = storeRows[0] as { name: string; slug: string; plan?: string; is_demo?: boolean } | undefined
  const planCtx = raw ? getStorePlanContext(raw) : null
  return {
    store: raw
      ? {
          name: raw.name,
          slug: raw.slug,
          plan: planCtx?.plan ?? raw.plan,
          isDemo: planCtx?.isDemo ?? false,
        }
      : undefined,
    newOrdersCount: Number(countRows[0]?.c ?? 0),
  }
})
