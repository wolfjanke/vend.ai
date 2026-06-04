import { notFound } from 'next/navigation'
import NonBlockingFontLink from '@/components/loja/NonBlockingFontLink'
import { resolveStoreTheme } from '@/lib/theme-css'
import { getStorePublicRow } from '@/lib/store-public-data'

interface Props {
  slug: string
  children: React.ReactNode
}

export default async function StoreThemeWrapper({ slug, children }: Props) {
  try {
    const storeRow = await getStorePublicRow(slug)
    if (!storeRow) notFound()

    const resolved = resolveStoreTheme(storeRow)

    return (
      <>
        <NonBlockingFontLink href={resolved.fontUrl} />
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
    console.error('[store/StoreThemeWrapper]', slug, e)
    return <div className="min-h-screen font-dm">{children}</div>
  }
}
