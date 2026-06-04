import { Suspense } from 'react'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import StoreLoading from './loading'
import StoreThemeWrapper from './StoreThemeWrapper'

interface Props {
  children: React.ReactNode
  params: { slug: string }
}

export default function StoreLayout({ children, params }: Props) {
  if (isReservedStoreSlug(params.slug)) {
    return <>{children}</>
  }

  return (
    <Suspense fallback={<StoreLoading />}>
      <StoreThemeWrapper slug={params.slug}>{children}</StoreThemeWrapper>
    </Suspense>
  )
}
