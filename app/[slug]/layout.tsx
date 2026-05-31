import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import { resolveStoreTheme } from '@/lib/theme-css'

interface Props {
  children: React.ReactNode
  params: { slug: string }
}

export default async function StoreLayout({ children, params }: Props) {
  if (isReservedStoreSlug(params.slug)) {
    return <>{children}</>
  }

  const rows = await sql`
    SELECT
      theme_name, theme_primary_color, theme_secondary_color, theme_accent_color,
      theme_background, theme_shimmer, theme_logo_url, logo_url
    FROM stores
    WHERE slug = ${params.slug}
    LIMIT 1
  `
  if (!rows[0]) notFound()

  const resolved = resolveStoreTheme(rows[0] as Record<string, unknown>)

  return (
    <>
      <link rel="stylesheet" href={resolved.fontUrl} />
      <style
        dangerouslySetInnerHTML={{
          __html: `.store-theme-root { ${resolved.css} }`,
        }}
      />
      <div className="store-theme-root min-h-screen font-dm">{children}</div>
    </>
  )
}
