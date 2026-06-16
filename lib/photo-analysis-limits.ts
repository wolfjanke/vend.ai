import { sql } from '@/lib/db'
import { getPlan, type PlanSlug } from '@/lib/plans'

function monthChanged(resetAt: string | Date | null): boolean {
  if (!resetAt) return true
  const r = new Date(resetAt)
  const now = new Date()
  return r.getUTCFullYear() !== now.getUTCFullYear() || r.getUTCMonth() !== now.getUTCMonth()
}

export async function checkPhotoAnalysisLimit(storeId: string, plan: PlanSlug): Promise<{
  allowed: boolean
  used:    number
  limit:   number | null
}> {
  const planDef = getPlan(plan)
  const limit = planDef.photoAnalysisLimit
  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0 }
  }
  if (limit == null) return { allowed: true, used: 0, limit: null }

  const rows = await sql`
    SELECT photo_analysis_used, photo_analysis_reset_at
    FROM stores WHERE id = ${storeId} LIMIT 1
  `
  const row = rows[0] as { photo_analysis_used: number; photo_analysis_reset_at: string } | undefined
  if (!row) return { allowed: false, used: 0, limit }

  if (monthChanged(row.photo_analysis_reset_at)) {
    await sql`
      UPDATE stores SET photo_analysis_used = 0, photo_analysis_reset_at = NOW()
      WHERE id = ${storeId}
    `
    return { allowed: true, used: 0, limit }
  }

  const used = Number(row.photo_analysis_used ?? 0)
  return { allowed: used < limit, used, limit }
}

export async function incrementPhotoAnalysis(storeId: string): Promise<void> {
  await sql`
    UPDATE stores SET photo_analysis_used = photo_analysis_used + 1
    WHERE id = ${storeId}
  `
}
