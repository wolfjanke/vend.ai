import type { AssistantTone } from '@/lib/vi-prompt'

export { defaultWelcomeMessage } from '@/lib/assistant-gender'
export type { AssistantGender } from '@/lib/assistant-gender'

export type ViTriggerProduct = {
  name:      string
  slug:      string
  sizes:     string[]
  inStock:   boolean
  productUrl: string
}

export function allowsViEmoji(tone: AssistantTone): boolean {
  return tone === 'friendly' || tone === 'playful'
}

function linkLead(tone: AssistantTone): string {
  return allowsViEmoji(tone) ? '👉 ' : ''
}

export function browseIdleMessage(_assistantName: string, tone: AssistantTone = 'friendly'): string {
  if (tone === 'playful') {
    return 'Precisa de ajuda para achar algo? 😊 Me diz o estilo ou ocasião que te ajudo!'
  }
  return 'Precisa de ajuda para achar algo? Me diz o estilo ou ocasião que te ajudo!'
}

export function productFocusMessage(p: ViTriggerProduct, tone: AssistantTone = 'friendly'): string {
  const sizes = p.sizes.length ? p.sizes.join(', ') : 'consulte a página'
  const lead = linkLead(tone)
  return `Gostando do **${p.name}**? Temos nos tamanhos ${sizes}. Quer saber mais? ${lead}[Ver produto](${p.productUrl})`
}

export function cartAbandonedMessage(tone: AssistantTone = 'friendly'): string {
  if (tone === 'playful') {
    return 'Seu carrinho está te esperando! 🛍️ Tem alguma dúvida sobre tamanho ou entrega antes de finalizar?'
  }
  return 'Seu carrinho está te esperando! Tem alguma dúvida sobre tamanho ou entrega antes de finalizar?'
}

export function inactivityChatMessage(assistantName: string, whatsappUrl: string): string {
  return `Ainda por aqui? Posso te ajudar a encontrar algo especial ou prefere falar com a gente pelo [WhatsApp](${whatsappUrl})?`
}

export function soldOutMessage(
  productName: string,
  alternative: ViTriggerProduct | null,
  tone: AssistantTone = 'friendly',
): string {
  const suffix = tone === 'playful' ? ' 😕' : ''
  const lead = linkLead(tone)
  if (!alternative) {
    return `Esse **${productName}** está esgotado no momento${suffix} Quer que eu sugira outra opção do catálogo?`
  }
  return `Esse **${productName}** está esgotado no momento${suffix} Mas temos **${alternative.name}** disponível! ${lead}[Ver aqui](${alternative.productUrl})`
}

export function findSimilarInStock(
  products: import('@/types').Product[],
  category: string,
  excludeId: string,
  baseUrl: string,
  storeSlug: string,
): ViTriggerProduct | null {
  const alt = products.find(p => {
    if (p.id === excludeId) return false
    if (p.category !== category) return false
    return p.variants_json.some(v =>
      Object.values(v.stock).some(q => Number(q) > 0),
    )
  })
  if (!alt) return null
  const slug = alt.slug?.trim() || alt.id
  const sizes = alt.variants_json.flatMap(v =>
    Object.entries(v.stock).filter(([, q]) => Number(q) > 0).map(([s]) => s),
  )
  return {
    name:       alt.name,
    slug,
    sizes:      [...new Set(sizes)],
    inStock:    true,
    productUrl: `${baseUrl}/${storeSlug}/produto/${slug}`,
  }
}

export function productToTrigger(
  p: import('@/types').Product,
  baseUrl: string,
  storeSlug: string,
): ViTriggerProduct {
  const slug = p.slug?.trim() || p.id
  const sizes = p.variants_json.flatMap(v =>
    Object.entries(v.stock).filter(([, q]) => Number(q) > 0).map(([s]) => s),
  )
  const inStock = p.variants_json.some(v =>
    Object.values(v.stock).some(q => Number(q) > 0),
  )
  return {
    name:       p.name,
    slug,
    sizes:      [...new Set(sizes)],
    inStock,
    productUrl: `${baseUrl}/${storeSlug}/produto/${slug}`,
  }
}
