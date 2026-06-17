import { SITE_ENTITY } from '@/lib/site-seo'

/** Loja de demonstração pública (landing, SEO, vitrine de exemplo). */
export const DEMO_STORE_SLUG = 'urban-mix'
export const DEMO_STORE_NAME = 'Urban Mix'
export const DEMO_STORE_PATH = SITE_ENTITY.demoStorePath

export function isDemoStoreSlug(slug: string | null | undefined): boolean {
  return slug === DEMO_STORE_SLUG
}
