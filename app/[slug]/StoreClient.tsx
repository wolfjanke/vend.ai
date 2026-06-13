'use client'

import type { Product, Store } from '@/types'
import type { StoreThemeConfig } from '@/lib/themes'
import type { PlanSlug } from '@/lib/plans'
import type { CategoryNavStyle } from '@/lib/category-nav'
import LojaShell from '@/components/loja/LojaShell'
import Catalogo from '@/components/loja/Catalogo'
import { getStoreProfile } from '@/types'
import { useLoja } from '@/components/loja/LojaContext'

function installmentsMaxFromSettings(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
  if (!Number.isFinite(n) || n < 1 || n > 48) return null
  return Math.floor(n)
}

function CatalogoView({
  initialCategory = '',
  useCategoryLinks = false,
}: {
  initialCategory?: string
  useCategoryLinks?: boolean
}) {
  const { store, products, cardTheme, addToCart, onProductFocus } = useLoja()
  const settings = store.settings_json ?? {}
  const storeProfile = getStoreProfile(settings)
  const categoryNavStyle = (settings.categoryNavStyle ?? 'pills') as CategoryNavStyle

  return (
    <Catalogo
      products={products}
      profile={storeProfile}
      customCategories={settings.customCategories ?? []}
      cardTheme={cardTheme}
      onAddToCart={addToCart}
      onProductFocus={onProductFocus}
      installmentsMaxNoInterest={installmentsMaxFromSettings(settings.installmentsMaxNoInterest)}
      initialCategory={initialCategory}
      categoryNavStyle={categoryNavStyle}
      storeSlug={store.slug}
      useCategoryLinks={useCategoryLinks}
    />
  )
}

interface Props {
  store:            Store
  products:           Product[]
  cardTheme:          StoreThemeConfig
  plan?:              PlanSlug
  initialCategory?:   string
  useCategoryLinks?:  boolean
}

export default function StoreClient({
  store,
  products,
  cardTheme,
  plan = 'free',
  initialCategory = '',
  useCategoryLinks = false,
}: Props) {
  return (
    <LojaShell store={store} products={products} cardTheme={cardTheme} plan={plan}>
      <CatalogoView
        initialCategory={initialCategory}
        useCategoryLinks={useCategoryLinks}
      />
    </LojaShell>
  )
}
