import type { ConfigSectionId } from '@/components/admin/ConfigSectionNav'

export const LOJA_SECTIONS = [
  {
    id:          'identidade',
    label:       'Identidade',
    description: 'Nome, logo, WhatsApp e layout da vitrine',
  },
  {
    id:          'visual',
    label:       'Visual',
    description: 'Tema, cores e preview da vitrine',
  },
  {
    id:          'promocoes',
    label:       'Promoções',
    description: 'Banners, cupons e desconto PIX',
  },
  {
    id:          'venda',
    label:       'Venda',
    description: 'Frete, entrega, PIX e formas de pagamento',
  },
  {
    id:          'vi',
    label:       'Vi',
    description: 'Assistente IA — mensagens e limites',
  },
  {
    id:          'conta',
    label:       'Conta',
    description: 'Acesso, cobrança do plano e privacidade',
  },
] as const

export type LojaSectionId = (typeof LOJA_SECTIONS)[number]['id']

const LOJA_SECTION_IDS = new Set<string>(LOJA_SECTIONS.map(s => s.id))

export function parseLojaSection(raw: string | null | undefined): LojaSectionId {
  if (raw && LOJA_SECTION_IDS.has(raw)) return raw as LojaSectionId
  return 'identidade'
}

export function lojaSectionToConfigSection(id: LojaSectionId): ConfigSectionId | null {
  switch (id) {
    case 'identidade': return 'config-loja'
    case 'venda':      return 'config-venda'
    case 'vi':         return 'config-vi'
    case 'conta':      return 'config-conta'
    default:           return null
  }
}

export function lojaSectionHref(id: LojaSectionId): string {
  return `/admin/loja?secao=${id}`
}

export function lojaSectionLabel(id: LojaSectionId): string {
  return LOJA_SECTIONS.find(s => s.id === id)?.label ?? 'Minha loja'
}

export function lojaSectionDescription(id: LojaSectionId): string {
  return LOJA_SECTIONS.find(s => s.id === id)?.description ?? ''
}
