import { notFound } from 'next/navigation'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import { resolveStoreTheme } from '@/lib/theme-css'
import { getStorePublicRow } from '@/lib/store-public-data'

interface Props {
  children: React.ReactNode
  params: { slug: string }
}

export default async function StoreLayout({ children, params }: Props) {
  if (isReservedStoreSlug(params.slug)) {
    return <>{children}</>
  }

  try {
    const storeRow = await getStorePublicRow(params.slug)
    if (!storeRow) notFound()

    const resolved = resolveStoreTheme(storeRow)

    return (
      <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={resolved.fontUrl} />
        <style
          dangerouslySetInnerHTML={{
            __html: `.store-theme-root { ${resolved.css} }`,
          }}
        />
        <div
          id="store-theme-root"
          className="store-theme-root min-h-screen font-dm"
          data-theme={resolved.themeName}
          data-info-position={resolved.cardTheme.infoPosition}
        >
          {children}
        </div>
      </>
    )
  } catch (e) {
    console.error('[store/layout]', params.slug, e)
    return <div className="min-h-screen font-dm">{children}</div>
  }
}
