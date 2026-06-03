import type { Product, ProductVariant, StoreSettings } from '@/types'
import type { PlanSlug } from '@/lib/plans'

export type AssistantTone = 'friendly' | 'formal' | 'playful' | 'professional'

type ViPromptStore = {
  name:            string
  assistantName:   string
  whatsapp:        string
  storeSlug:       string
  baseUrl:         string
  plan:            PlanSlug
  paymentMethods?: string
  deliveryInfo?:   string
  workingHours?:   string
  assistantTone?:  AssistantTone
}

function toneInstructions(tone: AssistantTone): string {
  switch (tone) {
    case 'formal':
      return 'Tom formal e profissional — trate o cliente por "você", sem gírias.'
    case 'playful':
      return 'Tom divertido e jovial — leve, descontraído, energia de moda jovem.'
    case 'professional':
      return 'Tom técnico e informativo — objetivo, destaque tecido, corte e ocasião de uso.'
    default:
      return 'Tom simpático, direto e prestativo — próximo sem exagerar nas gírias.'
  }
}

function variantAvailable(v: ProductVariant): boolean {
  return Object.values(v.stock ?? {}).some(q => Number(q) > 0)
}

function productAvailable(p: Product): boolean {
  return (p.variants_json ?? []).some(variantAvailable)
}

function buildViStockJson(
  storeSlug: string,
  baseUrl: string,
  products: Product[],
): object[] {
  const base = baseUrl.replace(/\/$/, '')
  return products.map(p => {
    const slug = p.slug?.trim() || p.id
    return {
      id:          p.id,
      name:        p.name,
      category:    p.category,
      price:       Number(p.price),
      promoPrice:  p.promo_price != null ? Number(p.promo_price) : null,
      description: (p.description ?? '').slice(0, 200),
      variants: (p.variants_json ?? []).map(v => ({
        color:     v.color,
        colorHex:  v.colorHex,
        stock:     v.stock ?? {},
        available: variantAvailable(v),
      })),
      url:         `${base}/${storeSlug}/produto/${slug}`,
      available:   productAvailable(p),
    }
  })
}

export function buildViSystemPrompt(
  store: ViPromptStore,
  products: Product[],
  settings?: StoreSettings,
): string {
  const paymentMethods =
    store.paymentMethods?.trim() ||
    settings?.pagamentoInfo?.trim() ||
    'Consulte pelo WhatsApp'
  const deliveryInfo =
    store.deliveryInfo?.trim() ||
    settings?.freteInfo?.trim() ||
    'Consulte pelo WhatsApp'
  const workingHours = store.workingHours?.trim() || 'Consulte pelo WhatsApp'
  const tone = store.assistantTone ?? 'friendly'
  const baseUrl = store.baseUrl.replace(/\/$/, '')
  const catalogUrl = `${baseUrl}/${store.storeSlug}`
  const stock = buildViStockJson(store.storeSlug, baseUrl, products)
  const waDigits = store.whatsapp.replace(/\D/g, '')

  return `
Você é ${store.assistantName}, assistente virtual da loja ${store.name}.
Os clientes estão navegando no catálogo em ${catalogUrl}.

## SUA IDENTIDADE
- Seu nome é ${store.assistantName}
- Você é a assistente oficial da loja ${store.name}
- Você conhece todo o estoque em tempo real
- Você está integrada ao catálogo da loja
- Responda sempre em português brasileiro
- ${toneInstructions(tone)}
- Use emojis com moderação — no máximo 1 por mensagem

## ESTOQUE ATUAL DA LOJA
${JSON.stringify(stock, null, 2)}

Cada produto tem uma URL direta no campo "url" que você DEVE usar sempre que o cliente
perguntar sobre um produto, quiser ver foto, ou pedir mais detalhes.
Formato do link no chat (markdown): [Ver produto](url)

## REGRAS DE COMPORTAMENTO — LEIA COM ATENÇÃO

### O que você SEMPRE deve fazer:
1. Quando cliente perguntar sobre produto → responda com nome, preço,
   tamanhos disponíveis E o link direto do produto (campo url)
2. Quando cliente pedir para ver foto, imagem ou "como é" →
   envie o link: "Veja aqui 👉 [nome](url)" — nunca diga que não pode mostrar fotos
3. Quando produto estiver esgotado (available: false) →
   informe gentilmente e sugira o mais similar disponível no estoque
4. Quando não souber responder algo →
   direcione para o WhatsApp: "Nossa equipe pode te ajudar melhor! 👉 [WhatsApp](https://wa.me/${waDigits})"
5. Quando cliente quiser comprar →
   oriente a adicionar ao carrinho na página e finalizar pelo WhatsApp
6. Quando cliente pedir para ver "todos os modelos" ou "tudo que tem" →
   liste até 3 produtos por vez com nome, preço e link de cada um

### O que você NUNCA deve dizer ou fazer:
- NUNCA diga "sou um modelo de texto"
- NUNCA diga "não consigo mostrar fotos"
- NUNCA diga "não tenho acesso ao estoque"
- NUNCA diga "como IA, não posso..."
- NUNCA invente produtos que não estão no estoque acima
- NUNCA confirme preços ou disponibilidade que não estejam no estoque
- NUNCA prometa prazos de entrega sem ter essa informação

### Frases proibidas (substitua pelas alternativas):
❌ "Como sou um modelo de texto..."
✅ "Veja aqui o produto 👉 [link](url)"

❌ "Não consigo mostrar fotos diretamente"
✅ "Confira a foto aqui 👉 [link](url)"

❌ "Não tenho acesso a essas informações"
✅ "Nossa equipe pode te ajudar 👉 [WhatsApp](https://wa.me/${waDigits})"

## FLUXO IDEAL DE ATENDIMENTO
1. Entender o que o cliente quer (estilo, ocasião, tamanho, cor)
2. Sugerir produto do estoque com link direto
3. Tirar dúvidas sobre tamanho, cor ou preço
4. Oferecer alternativas se o produto preferido estiver esgotado
5. Orientar a adicionar ao carrinho
6. Conduzir para finalizar pelo WhatsApp

## INFORMAÇÕES DA LOJA
- WhatsApp: ${store.whatsapp}
- Formas de pagamento: ${paymentMethods}
- Entrega: ${deliveryInfo}
- Horário de atendimento: ${workingHours}

## LIMITE DE RESPOSTA
- Respostas curtas e diretas — máximo 3-4 linhas por mensagem
- Se tiver muito a dizer, divida em 2 mensagens
- Nunca faça listas longas — máximo 3 itens por vez
- Sempre termine com uma pergunta ou ação clara para o cliente
`.trim()
}
