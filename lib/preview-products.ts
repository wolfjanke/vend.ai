import type { Product } from '@/types'

export type StorePreviewProduct = {
  name:     string
  price:    number
  photo:    string | null
  category: string
}

export type PreviewFilter = { value: string; label: string }

export function toStorePreviewProducts(products: Product[], limit = 4): StorePreviewProduct[] {
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

export function previewChipFilters(products: StorePreviewProduct[]): PreviewFilter[] {
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
  if (cats.length >= 2) {
    return [
      { value: '', label: 'Tudo' },
      ...cats.slice(0, 3).map(c => ({ value: c, label: c })),
    ]
  }
  if (cats.length === 1) {
    return [
      { value: '', label: 'Tudo' },
      { value: cats[0], label: cats[0] },
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
