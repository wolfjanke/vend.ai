import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Store } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import AparenciaClient from './AparenciaClient'

export default async function AparenciaPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const rows = await sql`
    SELECT
      slug, plan, logo_url,
      theme_name, theme_primary_color, theme_secondary_color, theme_accent_color,
      theme_background, theme_shimmer, theme_logo_url, theme_onboarding_done
    FROM stores
    WHERE id = ${session.storeId}
    LIMIT 1
  `
  const store = rows[0] as Store | undefined
  if (!store) redirect('/cadastro')

  return (
    <div className="animate-fade-up max-w-6xl min-w-0">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Aparência</h1>
        <p className="text-sm text-muted break-words">
          Temas visuais, cores e preview da vitrine
        </p>
      </div>
      <AparenciaClient
        slug={store.slug}
        plan={(store.plan ?? 'free') as PlanSlug}
        initial={{
          theme_name:            (store.theme_name as string) ?? 'default',
          theme_primary_color:   store.theme_primary_color ?? null,
          theme_secondary_color: store.theme_secondary_color ?? null,
          theme_accent_color:    store.theme_accent_color ?? null,
          theme_background:      (store.theme_background as 'light' | 'dark') ?? 'dark',
          theme_shimmer:         Boolean(store.theme_shimmer),
          theme_logo_url:        store.theme_logo_url ?? store.logo_url ?? null,
        }}
      />
    </div>
  )
}
