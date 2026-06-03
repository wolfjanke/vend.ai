import type { ProductVariant } from '@/types'

/** Primeira URL de foto válida da variação (`photos[]` ou legado `photo_url`). */
export function getVariantPhotoUrl(variant: ProductVariant | undefined | null): string | null {
  if (!variant) return null

  const photos = variant.photos
  if (Array.isArray(photos)) {
    for (const url of photos) {
      if (typeof url === 'string' && url.trim()) return url.trim()
    }
  }

  const legacy = (variant as ProductVariant & { photo_url?: string }).photo_url
  if (typeof legacy === 'string' && legacy.trim()) return legacy.trim()

  return null
}
