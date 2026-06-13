'use client'

import type { CartItem, CustomCategory, ProductVariantDisplay } from '@/types'
import type { StoreThemeConfig } from '@/lib/themes'
import ProductStrip from './ProductStrip'
import ProductGrid from './ProductGrid'

interface Props {
  sectionId:   string
  title:       string
  countLabel?: string
  displayItems: ProductVariantDisplay[]
  cardTheme:   StoreThemeConfig
  onAddToCart: (item: CartItem) => void
  onInteract?: () => void
  onProductFocus?: (product: import('@/types').Product) => void
  installmentsMaxNoInterest?: number | null
  customCategories?: CustomCategory[]
}

/** Escolhe strip ou grid conforme preset do tema. */
export default function ProductSection(props: Props) {
  if (props.cardTheme.catalogLayout === 'strip') {
    return <ProductStrip {...props} />
  }
  return <ProductGrid {...props} />
}
