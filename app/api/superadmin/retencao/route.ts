import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
import { logServerError } from '@/lib/logger'
export { dynamic } from '@/lib/route-dynamic'

export type RetentionFilter = 'pending' | 'granted' | 'dismissed' | 'all'

const VALID_FILTERS: RetentionFilter[] = ['pending', 'granted', 'dismissed', 'all']

function daysRemaining(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
}

function mapRow(row: Record<string, unknown>) {
  const status = row.subscription_status as string | null
  const trialEnds = row.trial_ends_at as string | null
  const subEnds = row.subscription_ends_at as string | null
  const endIso = status === 'TRIAL' ? trialEnds : subEnds

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    plan: String(row.plan),
    subscriptionStatus: status,
    ownerEmail: row.owner_email ? String(row.owner_email) : null,
    ownerWhatsapp: row.whatsapp ? String(row.whatsapp) : null,
    clickedAt: row.retention_offer_clicked_at ? String(row.retention_offer_clicked_at) : null,
    grantedAt: row.retention_bonus_granted_at ? String(row.retention_bonus_granted_at) : null,
    dismissedAt: row.retention_bonus_dismissed_at ? String(row.retention_bonus_dismissed_at) : null,
    grantedBy: row.retention_bonus_granted_by ? String(row.retention_bonus_granted_by) : null,
    daysRemaining: daysRemaining(endIso),
  }
}

export async function GET(req: NextRequest) {
  const { error } = await requireSuperadmin()
  if (error) return error

  const filter = (req.nextUrl.searchParams.get('filter') ?? 'pending') as RetentionFilter
  if (!VALID_FILTERS.includes(filter)) {
    return NextResponse.json({ error: 'Filtro inválido' }, { status: 400 })
  }

  try {
    let rows: Record<string, unknown>[]

    if (filter === 'pending') {
      rows = await sql`
        SELECT
          s.id, s.name, s.slug, s.plan, s.subscription_status,
          s.trial_ends_at, s.subscription_ends_at,
          s.retention_offer_clicked_at, s.retention_bonus_granted_at,
          s.retention_bonus_dismissed_at, s.retention_bonus_granted_by,
          s.whatsapp, COALESCE(s.owner_email, u.email) AS owner_email
        FROM stores s
        LEFT JOIN admin_users u ON u.store_id = s.id
        WHERE s.retention_offer_clicked_at IS NOT NULL
          AND s.retention_bonus_granted_at IS NULL
          AND s.retention_bonus_dismissed_at IS NULL
          AND s.subscription_status IS DISTINCT FROM 'CANCELLED'
          AND s.plan <> 'free'
          AND COALESCE(s.is_demo, false) = false
        ORDER BY s.retention_offer_clicked_at DESC
        LIMIT 100
      ` as Record<string, unknown>[]
    } else if (filter === 'granted') {
      rows = await sql`
        SELECT
          s.id, s.name, s.slug, s.plan, s.subscription_status,
          s.trial_ends_at, s.subscription_ends_at,
          s.retention_offer_clicked_at, s.retention_bonus_granted_at,
          s.retention_bonus_dismissed_at, s.retention_bonus_granted_by,
          s.whatsapp, COALESCE(s.owner_email, u.email) AS owner_email
        FROM stores s
        LEFT JOIN admin_users u ON u.store_id = s.id
        WHERE s.retention_bonus_granted_at IS NOT NULL
          AND COALESCE(s.is_demo, false) = false
        ORDER BY s.retention_bonus_granted_at DESC
        LIMIT 100
      ` as Record<string, unknown>[]
    } else if (filter === 'dismissed') {
      rows = await sql`
        SELECT
          s.id, s.name, s.slug, s.plan, s.subscription_status,
          s.trial_ends_at, s.subscription_ends_at,
          s.retention_offer_clicked_at, s.retention_bonus_granted_at,
          s.retention_bonus_dismissed_at, s.retention_bonus_granted_by,
          s.whatsapp, COALESCE(s.owner_email, u.email) AS owner_email
        FROM stores s
        LEFT JOIN admin_users u ON u.store_id = s.id
        WHERE s.retention_bonus_dismissed_at IS NOT NULL
          AND COALESCE(s.is_demo, false) = false
        ORDER BY s.retention_bonus_dismissed_at DESC
        LIMIT 100
      ` as Record<string, unknown>[]
    } else {
      rows = await sql`
        SELECT
          s.id, s.name, s.slug, s.plan, s.subscription_status,
          s.trial_ends_at, s.subscription_ends_at,
          s.retention_offer_clicked_at, s.retention_bonus_granted_at,
          s.retention_bonus_dismissed_at, s.retention_bonus_granted_by,
          s.whatsapp, COALESCE(s.owner_email, u.email) AS owner_email
        FROM stores s
        LEFT JOIN admin_users u ON u.store_id = s.id
        WHERE s.retention_offer_clicked_at IS NOT NULL
          AND COALESCE(s.is_demo, false) = false
        ORDER BY s.retention_offer_clicked_at DESC
        LIMIT 100
      ` as Record<string, unknown>[]
    }

    return NextResponse.json({ items: rows.map(mapRow), filter })
  } catch (err) {
    logServerError('[GET /api/superadmin/retencao]', err)
    return NextResponse.json({ error: 'Falha ao carregar retenção' }, { status: 500 })
  }
}
