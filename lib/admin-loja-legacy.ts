import type { LojaSectionId } from '@/lib/admin-loja-sections'

/** Mapeia tabs/hash legados de Configurações → seção em Minha loja. */
const LEGACY_TO_LOJA: Record<string, LojaSectionId> = {
  identidade:   'identidade',
  loja:         'identidade',
  'config-loja': 'identidade',
  visual:       'visual',
  aparencia:    'visual',
  promocoes:    'promocoes',
  marketing:    'promocoes',
  venda:        'venda',
  'config-venda': 'venda',
  vi:           'vi',
  'config-vi':  'vi',
  conta:        'conta',
  'config-conta': 'conta',
}

export function resolveLegacyLojaSection(
  raw: string | null | undefined,
  fallback: LojaSectionId = 'identidade',
): LojaSectionId {
  if (!raw?.trim()) return fallback
  const key = raw.trim().toLowerCase()
  return LEGACY_TO_LOJA[key] ?? fallback
}
