import type { BannerMessage, BannerMotion } from '@/types'
import { sql } from '@/lib/db'

/**
 * Roadmap interno (produto): avaliar banner com imagem (hero) quando atingir este
 * número de lojas ativas. Critério: subscription_status = 'ACTIVE', is_demo = false.
 * @see countActiveStoresForBannerRoadmap
 */
export const BANNER_IMAGE_ROADMAP_MIN_ACTIVE_STORES = 10

/** Separador legado (banners antigos com marquee). */
export const BANNER_MARQUEE_SEPARATOR = ' — '

export const BANNER_ROTATE_MS = 6_000

/** Máximo de caracteres recomendado para texto do banner na faixa mobile. */
export const BANNER_TEXT_MAX_CHARS = 120

export type { BannerMotion }

export function normalizeBannerMotion(raw: unknown): BannerMotion {
  if (raw === 'pulse') return 'pulse'
  return 'none'
}

/** Texto exibido na vitrine (compatível com banners antigos só com title). */
export function resolveBannerDisplayText(banner: Pick<BannerMessage, 'text' | 'title'>): string {
  const text = banner.text?.trim() ?? ''
  if (text) return text
  return banner.title?.trim() ?? ''
}

export function filterActiveBanners(messages: BannerMessage[] | undefined): BannerMessage[] {
  if (!messages?.length) return []
  const now = new Date().toISOString().slice(0, 10)
  return messages
    .filter(m => {
      if (!resolveBannerDisplayText(m)) return false
      if (m.startDate && m.endDate && m.startDate > m.endDate) return false
      if (m.startDate && m.startDate > now) return false
      if (m.endDate && m.endDate < now) return false
      return true
    })
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
}

/** Contagem para gate interno do roadmap de banner com imagem (não expor ao lojista). */
export async function countActiveStoresForBannerRoadmap(): Promise<number> {
  const [row] = await sql`
    SELECT COUNT(*)::int AS c FROM stores
    WHERE subscription_status = 'ACTIVE'
      AND COALESCE(is_demo, false) = false
  `
  return Number(row?.c ?? 0)
}

export function isBannerImageRoadmapUnlocked(activeCount: number): boolean {
  return activeCount >= BANNER_IMAGE_ROADMAP_MIN_ACTIVE_STORES
}
