import type { CustomCategory } from '@/types'
import { getCategoryEmoji } from '@/lib/category-icons'

export type CategoryNavStyle = 'pills' | 'circles'

/** Emoji do chip: custom > mapa automático. */
export function resolveFilterEmoji(
  value: string,
  label: string,
  customCategories?: CustomCategory[],
): string {
  if (value === '') return '✨'
  if (value === 'sale') return '🔥'
  const custom = customCategories?.find(c => c.value === value)
  if (custom?.emoji?.trim()) return custom.emoji.trim()
  return getCategoryEmoji(value, label)
}

export function resolveFilterImageUrl(
  value: string,
  customCategories?: CustomCategory[],
): string | null {
  const custom = customCategories?.find(c => c.value === value)
  const url = custom?.imageUrl?.trim()
  return url || null
}

/** Aceita no máximo 1 pictográfico para emoji de categoria. */
export function normalizeCategoryEmoji(input: string): string | undefined {
  const trimmed = String(input ?? '').trim()
  if (!trimmed) return undefined
  const match = trimmed.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
  return match?.[0]
}
