import { BRAND } from '@/lib/brand'

export type LandingFaqItem = { q: string; a: string }

/** Perguntas da landing — fonte única para UI e JSON-LD (FAQPage). */
export const LANDING_FAQ_ITEMS: LandingFaqItem[] = [
  {
    q: 'Qual a diferença de vitrine e loja online?',
    a: 'A vitrine é seu catálogo com link próprio — o cliente navega, a Vi responde no lugar do Direct e o pedido formatado chega no WhatsApp. Não é e-commerce com checkout complexo; é o que funciona para quem já vende pelo Instagram.',
  },
  {
    q: 'Preciso saber de tecnologia para usar?',
    a: 'Não. O vendai.club foi feito pra quem nunca criou um site. Se você consegue usar o WhatsApp, consegue usar o vendai.club.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Nos planos pagos você pode cancelar a qualquer momento. Não há fidelidade nem multa.',
  },
  {
    q: 'O que a Vi faz exatamente?',
    a: 'A Vi é uma assistente com IA que atende seus clientes na loja: sugere produtos por estilo, cor ou tamanho, responde dúvidas e indica como finalizar o pedido pelo WhatsApp.',
  },
  {
    q: 'Tem limite de mensagens da Vi?',
    a: 'Cada plano inclui um volume de mensagens da Vi por mês — no Grátis são 500 mensagens. Ao atingir o limite no plano Grátis, a Vi direciona o cliente para seu WhatsApp. Nos planos pagos, você continua sendo atendido com cobrança proporcional do excedente. Você acompanha o consumo em tempo real no painel.',
  },
  {
    q: 'Qual o limite de produtos em cada plano?',
    a: 'Grátis: 10 produtos. Starter: 50. Pro: 200. Loja e Enterprise: ilimitado. Cada cor, modelo, estampa ou material diferente conta como 1 produto. Tamanhos (P, M, G, etc.) são variações gratuitas dentro do mesmo produto.',
  },
  {
    q: 'Como funcionam os alertas de estoque?',
    a: 'Em Produtos, você ativa os alertas e define quando avisar (ex.: ≤ 3 peças por tamanho ou cor). Os avisos aparecem no dashboard e na lista de produtos — só dentro do painel, sem e-mail.',
  },
  {
    q: 'A análise de foto com IA funciona no plano grátis?',
    a: 'Não. O plano Grátis permite cadastro manual de produtos. A análise de foto com IA está nos planos pagos: Starter (20 análises/mês), Pro e superiores (ilimitado).',
  },
  {
    q: 'Tem período de teste nos planos pagos?',
    a: 'Sim. Na primeira assinatura paga: Starter, Pro e Loja incluem 14 dias grátis; Enterprise, 30 dias. Use o plano Grátis (até 10 produtos) para conhecer a vitrine antes de assinar. O trial é único por loja — trocar de plano durante o trial não adiciona dias. A cobrança só ocorre após o período, se você mantiver o plano.',
  },
  {
    q: 'Posso pagar trimestral ou anual?',
    a: 'Sim. No painel, ao fazer upgrade, você escolhe Mensal, Trimestral (-10% no total) ou Anual (-20% no total). O valor exibido nos cards acima é o equivalente mensal base.',
  },
  {
    q: 'Como faço upgrade de plano?',
    a: 'Você começa criando sua loja grátis. Quando precisar de mais produtos e recursos, faça upgrade para Starter, Pro, Loja ou Enterprise no painel.',
  },
  {
    q: 'Onde ficam meus dados? Vocês vendem meus dados?',
    a: `Jamais. Seus dados e os da sua loja são armazenados de forma segura em servidores confiáveis. Não vendemos, compartilhamos ou usamos seus dados para fins comerciais. Trabalhamos em total conformidade com a LGPD (Lei 13.709/2018). Você pode solicitar exclusão dos seus dados a qualquer momento pelo e-mail ${BRAND.privacyEmail}.`,
  },
  {
    q: 'Preciso de CNPJ para usar?',
    a: 'Não. Você pode criar sua loja como pessoa física. Não pedimos CNPJ para começar.',
  },
  {
    q: 'O vendai.club processa pagamentos dos meus clientes?',
    a: 'Não. Você recebe direto no PIX, Mercado Pago, PagBank ou como preferir combinar no WhatsApp. O vendai.club organiza catálogo, pedidos e estoque — o dinheiro vai para a sua conta.',
  },
]
