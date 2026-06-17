import type { MetadataRoute } from 'next'
import { getPublicStoreSitemapEntries } from '@/lib/sitemap-stores'
import { siteUrl } from '@/lib/site-seo'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pages = [
    { path: '', priority: 1 },
    { path: '/sobre', priority: 0.9 },
    { path: '/cadastro', priority: 0.85 },
    { path: '/urban-mix', priority: 0.8 },
    { path: '/contato', priority: 0.5 },
    { path: '/termos', priority: 0.3 },
    { path: '/privacidade', priority: 0.3 },
  ] as const

  const staticEntries: MetadataRoute.Sitemap = pages.map(({ path, priority }) => ({
    url:             siteUrl(path),
    lastModified:    now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority,
  }))

  let storeEntries: MetadataRoute.Sitemap = []
  try {
    if (process.env.DATABASE_URL) {
      const stores = await getPublicStoreSitemapEntries()
      storeEntries = stores.map(({ slug, lastModified }) => ({
        url:             siteUrl(`/${slug}`),
        lastModified,
        changeFrequency: 'weekly' as const,
        priority:        0.6,
      }))
    }
  } catch (e) {
    console.error('[sitemap] lojas públicas', e)
  }

  return [...staticEntries, ...storeEntries]
}
