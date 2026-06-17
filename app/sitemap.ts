import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site-seo'

export default function sitemap(): MetadataRoute.Sitemap {
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

  return pages.map(({ path, priority }) => ({
    url:             siteUrl(path),
    lastModified:    now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority,
  }))
}
