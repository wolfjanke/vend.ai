import type { PlanSlug } from '@/lib/plans'
import { SITE_ENTITY } from '@/lib/site-seo'

/** Loja de demonstração pública (landing, SEO, vitrine de exemplo). */
export const DEMO_STORE_SLUG = 'urban-mix'
export const DEMO_STORE_NAME = 'Urban Mix'
export const DEMO_STORE_PATH = SITE_ENTITY.demoStorePath

/** Plano efetivo da loja demo — todos os recursos, sem cobrança. */
export const DEMO_EFFECTIVE_PLAN: PlanSlug = 'enterprise'

export function isDemoStoreSlug(slug: string | null | undefined): boolean {
  return slug === DEMO_STORE_SLUG
}

/** Loja interna da plataforma — não conta como cliente nem entra em métricas financeiras. */
export function isPlatformDemoStore(store: {
  is_demo?: boolean | null
  slug?:    string | null
}): boolean {
  return store.is_demo === true || isDemoStoreSlug(store.slug)
}
