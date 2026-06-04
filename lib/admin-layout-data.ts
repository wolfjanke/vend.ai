import { cache } from 'react'
import { sql } from '@/lib/db'

export type AdminShellData = {
  store: { name: string; slug: string; plan?: string } | undefined
  newOrdersCount: number
}

/** Dados do header/sidebar — uma ida ao banco por navegação no admin. */
export const getAdminShellData = cache(async (storeId: string): Promise<AdminShellData> => {
  const [storeRows, countRows] = await Promise.all([
    sql`SELECT name, slug, plan FROM stores WHERE id = ${storeId} LIMIT 1`,
    sql`
      SELECT COUNT(*)::int as c FROM orders
      WHERE store_id = ${storeId} AND status = 'NOVO'
    `,
  ])
  return {
    store: storeRows[0] as { name: string; slug: string; plan?: string } | undefined,
    newOrdersCount: Number(countRows[0]?.c ?? 0),
  }
})
