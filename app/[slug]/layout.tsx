import { Suspense } from 'react'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import { getStorePublicRow } from '@/lib/store-public-data'
import { resolveCatalogColsMobile } from '@/lib/vitrine-layout'
import type { PlanSlug } from '@/lib/plans'
import type { ThemeName } from '@/lib/themes'
import type { StoreSettings } from '@/types'
import StoreLoading from './loading'
import StoreThemeWrapper from './StoreThemeWrapper'

interface Props {
  children: React.ReactNode
  params: { slug: string }
}

export default async function StoreLayout({ children, params }: Props) {
  if (isReservedStoreSlug(params.slug)) {
    return <>{children}</>
  }

  const storeRow = await getStorePublicRow(params.slug)
  const catalogColsMobile = storeRow
    ? resolveCatalogColsMobile(
        (storeRow.theme_name ?? 'default') as ThemeName,
        (storeRow.settings_json as StoreSettings) ?? {},
        (storeRow.plan ?? 'free') as PlanSlug,
      )
    : 2

  return (
    <StoreThemeWrapper slug={params.slug}>
      <Suspense fallback={<StoreLoading catalogColsMobile={catalogColsMobile} />}>
        {children}
      </Suspense>
    </StoreThemeWrapper>
  )
}
