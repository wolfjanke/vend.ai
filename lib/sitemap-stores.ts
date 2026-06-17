import { sql } from '@/lib/db'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'

/** Rotas estáticas do app — não duplicar no sitemap de lojas. */
const STATIC_PATH_SLUGS = new Set([
  'sobre',
  'cadastro',
  'contato',
  'termos',
  'privacidade',
  'urban-mix',
  'admin',
  'superadmin',
  'api',
])

export type StoreSitemapEntry = {
  slug:         string
  lastModified: Date
}

/** Lojas com ao menos 1 produto ativo — candidatas à indexação. */
export async function getPublicStoreSitemapEntries(): Promise<StoreSitemapEntry[]> {
  const rows = await sql`
    SELECT
      s.slug,
      GREATEST(
        s.created_at,
        COALESCE(MAX(p.created_at), s.created_at)
      ) AS last_modified
    FROM stores s
    INNER JOIN products p ON p.store_id = s.id AND p.active = true
    GROUP BY s.id, s.slug, s.created_at
    ORDER BY s.slug
  `

  return (rows as { slug: string; last_modified: string }[])
    .filter((row) => {
      const slug = row.slug.trim().toLowerCase()
      return !isReservedStoreSlug(slug) && !STATIC_PATH_SLUGS.has(slug)
    })
    .map((row) => ({
      slug:         row.slug,
      lastModified: new Date(row.last_modified),
    }))
}
