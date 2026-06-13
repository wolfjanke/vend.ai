import type { CustomCategory } from '@/types'
import { vitrineText } from '@/lib/strip-emoji'

export type CategoryNavStyle = 'pills' | 'circles'

/** Rótulo sem emoji, com inicial maiúscula em cada palavra. */
export function formatCategoryLabel(input: string | null | undefined): string {
  const cleaned = vitrineText(input)
  if (!cleaned) return ''
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const lower = word.toLocaleLowerCase('pt-BR')
      return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1)
    })
    .join(' ')
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
