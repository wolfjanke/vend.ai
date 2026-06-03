import Link from 'next/link'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import { PLANS, PLAN_SLUGS, formatPlanPrice } from '@/lib/plans'

export default function SuperadminPlanosPage() {
  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader
        title="Planos"
        description="Definições atuais em lib/plans.ts — limites editáveis em Configurações"
      />

      <p className="text-sm text-muted mb-4 break-words">
        Para alterar limites e take rates em produção, use{' '}
        <Link href="/superadmin/configuracoes" className="text-[#FF6B6B] hover:underline">
          Configurações
        </Link>
        .
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PLAN_SLUGS.map(slug => {
          const p = PLANS[slug]
          return (
            <div key={slug} className="bg-surface border border-border rounded-2xl p-4 min-w-0">
              <h2 className="font-syne font-bold capitalize">{slug}</h2>
              <p className="text-2xl font-extrabold tabular-nums mt-1">{formatPlanPrice(p.price)}</p>
              <ul className="text-sm text-muted mt-3 space-y-1">
                <li>Produtos: {p.productLimit ?? '∞'}</li>
                <li>Vi/mês: {p.viMessagesLimit.toLocaleString('pt-BR')}</li>
                <li>Foto análise: {p.photoAnalysisLimit ?? '∞'}</li>
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
