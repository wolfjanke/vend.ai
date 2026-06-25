import type { Product, CustomCategory } from '@/types'
import { getCategoryDisplayLabel } from '@/types'
import { formatCategoryLabel } from '@/lib/category-nav'
import { getTheme, type ThemeName, type StoreThemeConfig } from '@/lib/themes'
import { resolveCatalogColsMobile } from '@/lib/vitrine-layout'
import type { PlanSlug } from '@/lib/plans'

/** Máximo de colunas desktop entre todos os temas (Flash = 5). */
export const PREVIEW_PRODUCT_MAX = 5

/** Produtos suficientes para preencher a 1ª linha do grid no preview (mobile ou desktop). */
export function getPreviewProductLimit(
  themeName: ThemeName | string,
  plan: PlanSlug = 'free',
  mobileGridCols?: 2 | 3,
): number {
  const theme = getTheme(themeName as ThemeName)
  const mobile = resolveCatalogColsMobile(theme.name, { mobileGridCols }, plan)
  return Math.max(theme.catalogColsDesktop, mobile)
}

export type StorePreviewProduct = {
  name:     string
  price:    number
  photo:    string | null
  category: string
}

export type PreviewFilter = { value: string; label: string }

export function toStorePreviewProducts(products: Product[], limit = PREVIEW_PRODUCT_MAX): StorePreviewProduct[] {
  const mapped = products.map(p => {
    const variants = Array.isArray(p.variants_json) ? p.variants_json : []
    const photo = variants.find(v => v.photos?.[0])?.photos?.[0] ?? null
    const base = Number(p.price)
    const promo = p.promo_price != null ? Number(p.promo_price) : null
    const price = promo != null && promo < base ? promo : base
    return {
      name:     p.name,
      price:    Number.isFinite(price) ? price : 0,
      photo,
      category: (p.category || 'Geral').trim() || 'Geral',
    }
  })

  const withPhoto = mapped.filter(p => p.photo).slice(0, limit)
  if (withPhoto.length > 0) return withPhoto
  return mapped.slice(0, limit)
}

function previewCategoryLabel(slug: string, customCategories?: CustomCategory[]): string {
  return formatCategoryLabel(getCategoryDisplayLabel(slug, customCategories))
}

export function previewChipFilters(
  products: StorePreviewProduct[],
  customCategories?: CustomCategory[],
): PreviewFilter[] {
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
  if (cats.length >= 2) {
    return [
      { value: '', label: 'Tudo' },
      ...cats.slice(0, 3).map(c => ({
        value: c,
        label: previewCategoryLabel(c, customCategories),
      })),
    ]
  }
  if (cats.length === 1) {
    return [
      { value: '', label: 'Tudo' },
      {
        value: cats[0],
        label: previewCategoryLabel(cats[0], customCategories),
      },
      { value: 'novidades', label: 'Novidades' },
    ]
  }
  return [
    { value: '', label: 'Tudo' },
    { value: 'novidades', label: 'Novidades' },
    { value: 'destaques', label: 'Destaques' },
  ]
}

/** @deprecated Use previewChipFilters */
export function previewChipLabels(products: StorePreviewProduct[]): string[] {
  return previewChipFilters(products).map(f => f.label)
}

/** Produto mínimo para o preview admin usar `VitrineProductCard` (mesmo layout da vitrine). */
export function toMockProductForPreview(
  p: StorePreviewProduct,
  index: number,
  card: Pick<StoreThemeConfig, 'showDiscountBadge' | 'showColorSwatches'>,
): Product {
  const promoEligible = card.showDiscountBadge && index === 0 && p.price > 0
  const listPrice = promoEligible ? Math.round(p.price * 1.35 * 100) / 100 : p.price
  const promo = promoEligible ? p.price : null
  const photo = p.photo ?? ''

  const variants = card.showColorSwatches
    ? [
        { id: 'v1', color: 'Preto', colorHex: '#1a1a1a', photos: photo ? [photo] : [], stock: { U: 4 } },
        { id: 'v2', color: 'Branco', colorHex: '#f5f5f5', photos: [], stock: { U: 2 } },
        { id: 'v3', color: 'Azul', colorHex: '#2563eb', photos: [], stock: { U: 1 } },
      ]
    : [{
        id: 'v1',
        color: 'Único',
        colorHex: '#888888',
        photos: photo ? [photo] : [],
        stock: { U: 5 },
      }]

  return {
    id:            `preview-${index}`,
    store_id:      'preview',
    name:          p.name,
    slug:          `preview-${index}`,
    description:   '',
    category:      p.category,
    price:         listPrice,
    promo_price:   promo,
    variants_json: variants,
    active:        true,
    created_at:    new Date().toISOString(),
  }
}
