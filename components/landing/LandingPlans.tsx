import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import ScrollReveal from '@/components/landing/ScrollReveal'
import { PLANS, PLAN_SLUGS, formatPlanPrice, formatOverageLine, type PlanSlug } from '@/lib/plans'

const FEATURES: Record<PlanSlug, string[]> = {
  free: [
    'Até 10 produtos',
    '1.000 msgs Vi/mês',
    '10 análises de foto/mês',
    'Checkout integrado',
    'Pedidos via WhatsApp',
  ],
  starter: [
    'Até 25 produtos',
    '5.000 msgs Vi/mês',
    '50 análises de foto/mês',
    'IA no cadastro',
    'Checkout + link de pagamento',
  ],
  pro: [
    'Até 200 produtos',
    '15.000 msgs Vi/mês',
    '200 análises de foto/mês',
    'Vi completa + streaming',
    'Recuperação de pedido',
    'Métricas avançadas',
  ],
  loja: [
    'Produtos ilimitados',
    '40.000 msgs Vi/mês',
    'Vi completa + Mini PDV',
    'Análises de foto ilimitadas',
    'Métricas completas',
  ],
  enterprise: [
    'Produtos ilimitados',
    '60.000 msgs Vi/mês',
    'Para quem escala',
    'Vi completa + suporte prioritário',
    'Take rate reduzido',
  ],
}

export default function LandingPlans() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4 sm:gap-5 min-w-0">
      {PLAN_SLUGS.map((slug, i) => {
        const plan = PLANS[slug]
        const popular = slug === 'pro'
        const overage = formatOverageLine(slug)
        const priceLabel = formatPlanPrice(plan.price)

        return (
          <ScrollReveal key={slug} delay={i * 80}>
            <div
              className={`bg-surface border rounded-2xl p-5 sm:p-6 w-full flex flex-col h-full min-w-0 ${
                popular ? 'border-primary shadow-[0_0_0_1px_var(--primary-dim),0_20px_60px_var(--primary-glow)]' : 'border-border'
              }`}
            >
              {popular && (
                <span className="inline-flex bg-primary text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-3">
                  Mais popular
                </span>
              )}
              <h3 className="font-syne font-bold text-lg mb-2">{plan.name}</h3>
              <div className="mb-2 min-w-0">
                <p className="font-syne font-extrabold text-2xl sm:text-3xl text-accent tabular-nums leading-tight break-words">
                  {priceLabel}
                </p>
                <p className="text-sm text-muted font-medium">por mês</p>
              </div>
              {overage && (
                <p className="text-[11px] text-muted mb-4 break-words">{overage}</p>
              )}
              <ul className="flex flex-col gap-2 mb-6 flex-1 text-sm min-w-0">
                {FEATURES[slug].map(f => (
                  <li key={f} className="flex items-start gap-2 min-w-0">
                    <CheckCircle2 size={13} className="text-accent shrink-0 mt-0.5" />
                    <span className="break-words leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className={`block text-center w-full py-3 rounded-xl text-sm font-semibold min-h-[44px] flex items-center justify-center ${
                  popular
                    ? 'shimmer bg-primary text-white font-syne font-bold hover:shadow-[0_4px_20px_var(--primary-glow)]'
                    : 'border border-border hover:border-primary hover:text-primary transition-all'
                }`}
              >
                {slug === 'free' ? 'Começar grátis' : `Escolher ${plan.name}`}
              </Link>
            </div>
          </ScrollReveal>
        )
      })}
    </div>
  )
}
