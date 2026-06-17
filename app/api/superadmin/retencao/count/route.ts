import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
import { logServerError } from '@/lib/logger'
export { dynamic } from '@/lib/route-dynamic'

export async function GET() {
  const { error } = await requireSuperadmin()
  if (error) return error

  try {
    const [row] = await sql`
      SELECT COUNT(*)::int AS c FROM stores
      WHERE retention_offer_clicked_at IS NOT NULL
        AND retention_bonus_granted_at IS NULL
        AND retention_bonus_dismissed_at IS NULL
        AND subscription_status IS DISTINCT FROM 'CANCELLED'
        AND plan <> 'free'
        AND COALESCE(is_demo, false) = false
    `
    return NextResponse.json({ pending: Number(row?.c ?? 0) })
  } catch (err) {
    logServerError('[GET /api/superadmin/retencao/count]', err)
    return NextResponse.json({ pending: 0 })
  }
}
