/**
 * Slugs que não devem ser tratados como loja — evita que `/favicon.ico` etc.
 * caiam em `app/[slug]` e disparem SQL (500 no browser + erro de RSC).
 */
export const RESERVED_STORE_SLUGS = new Set([
  'favicon.ico',
  'favicon.png',
  'favicon.svg',
  'icon.png',
  'icon.svg',
  'robots.txt',
  'sitemap.xml',
  'sitemap_index.xml',
  'manifest.json',
  'manifest.webmanifest',
  'site.webmanifest',
  'sw.js',
  'service-worker.js',
  'apple-touch-icon.png',
  'apple-touch-icon-precomposed.png',
])

export function isReservedStoreSlug(slug: string): boolean {
  return RESERVED_STORE_SLUGS.has(slug.trim().toLowerCase())
}
