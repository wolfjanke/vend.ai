'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserMinus,
  Timer,
  AlertTriangle,
  TrendingUp,
  MessageCircle,
  Package,
} from 'lucide-react'
import SuperadminMetricCard from '@/components/superadmin/SuperadminMetricCard'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import StatusBadge from '@/components/superadmin/StatusBadge'
import SuperadminDashboardCharts from '@/components/superadmin/SuperadminDashboardCharts'
import EditDemoStoreButton from '@/components/superadmin/EditDemoStoreButton'
import { superadminCard, superadminLink } from '@/lib/superadmin-ui'

type DashboardData = {
  mrrFormatted: string
  arrFormatted: string
  newThisMonth: number
  churnThisMonth: number
  activeTrials: number
  inactive7d: number
  totalActive: number
  catalogRiskStores: number
  onboardingRiskStores: number
  retentionPending: number
  recentStores: Array<{
    id: string
    name: string
    slug: string
    plan: string
    subscription_status: string | null
    created_at: string
    last_login_at: string | null
    owner_email: string | null
  }>
  signupsByMonth: { month: string; count: number }[]
  revenueByMonth: { month: string; total_cents: number }[]
}

function formatMonth(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  } catch {
    return iso
  }
}

export default function SuperadminDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/superadmin/dashboard')
      .then(r => {
        if (!r.ok) throw new Error('Falha ao carregar')
        return r.json()
      })
      .then(setData)
      .catch(() => setErr('Não foi possível carregar o dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-muted text-sm animate-pulse">Carregando métricas…</p>
  }
  if (err || !data) {
    return <p className="text-warm text-sm break-words">{err || 'Erro'}</p>
  }

  const chartMap = new Map<string, { label: string; signups: number; revenue: number }>()
  for (const s of data.signupsByMonth) {
    const label = formatMonth(s.month)
    chartMap.set(label, { label, signups: s.count, revenue: 0 })
  }
  for (const r of data.revenueByMonth) {
    const label = formatMonth(r.month)
    const prev = chartMap.get(label) ?? { label, signups: 0, revenue: 0 }
    chartMap.set(label, { ...prev, revenue: r.total_cents / 100 })
  }
  const chartData = Array.from(chartMap.values())

  return (
    <div className="animate-fade-up min-w-0">
      <SuperadminPageHeader
        title="Dashboard"
        description="Visão geral do negócio vendai.club"
      />

      <div className="mb-6">
        <EditDemoStoreButton variant="card" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <SuperadminMetricCard
          icon={<LayoutDashboard size={22} className="text-warm" />}
          value={data.mrrFormatted}
          label="MRR atual"
          href="/superadmin/financeiro"
        />
        <SuperadminMetricCard
          icon={<TrendingUp size={22} className="text-warm" />}
          value={data.arrFormatted}
          label="ARR"
          href="/superadmin/financeiro"
        />
        <SuperadminMetricCard
          icon={<UserPlus size={22} className="text-primary" />}
          value={`+${data.newThisMonth}`}
          label="Novos este mês"
        />
        <SuperadminMetricCard
          icon={<UserMinus size={22} className="text-warm" />}
          value={data.churnThisMonth}
          label="Churn este mês"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <SuperadminMetricCard
          icon={<Users size={22} className="text-foreground" />}
          value={data.totalActive}
          label="Lojistas ativos"
          href="/superadmin/clientes?status=ACTIVE"
        />
        <SuperadminMetricCard
          icon={<Timer size={22} className="text-yellow-400" />}
          value={data.activeTrials}
          label="Trials ativos"
          href="/superadmin/trials"
        />
        <SuperadminMetricCard
          icon={<MessageCircle size={22} className="text-primary" />}
          value={data.retentionPending}
          label="Retenções pendentes"
          href="/superadmin/retencao"
        />
        <SuperadminMetricCard
          icon={<AlertTriangle size={22} className="text-warm" />}
          value={data.inactive7d}
          label="Inativos 7+ dias"
          href="/superadmin/engajamento?segment=risk"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 mb-6">
        <SuperadminMetricCard
          icon={<Package size={22} className="text-primary" />}
          value={data.catalogRiskStores}
          label="Lojas com menos de 3 produtos ativos"
          href="/superadmin/clientes"
        />
        <SuperadminMetricCard
          icon={<AlertTriangle size={22} className="text-warm" />}
          value={data.onboardingRiskStores}
          label="Novas 48h sem pedido e catálogo fraco"
          href="/superadmin/engajamento?segment=risk"
        />
      </div>

      <div className={`${superadminCard} mb-6 min-w-0`}>
        <h2 className="font-syne font-bold text-sm mb-3">Crescimento (6 meses)</h2>
        <SuperadminDashboardCharts data={chartData} />
      </div>

      <div className={`${superadminCard} overflow-hidden min-w-0 p-0`}>
        <div className="flex items-center justify-between gap-2 p-4 border-b border-border">
          <h2 className="font-syne font-bold text-sm">Últimos clientes</h2>
          <Link href="/superadmin/clientes" className={`text-xs font-medium ${superadminLink}`}>
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="p-3 font-medium">Loja</th>
                <th className="p-3 font-medium">Plano</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Criado</th>
                <th className="p-3 font-medium">Último acesso</th>
              </tr>
            </thead>
            <tbody>
              {data.recentStores.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-surface2/50">
                  <td className="p-3 min-w-0">
                    <Link href={`/superadmin/clientes/${s.id}`} className={`font-medium ${superadminLink} break-words`}>
                      {s.name}
                    </Link>
                    <div className="text-xs text-muted truncate" title={s.slug}>{s.slug}</div>
                  </td>
                  <td className="p-3 capitalize">{s.plan ?? 'free'}</td>
                  <td className="p-3"><StatusBadge status={s.subscription_status} /></td>
                  <td className="p-3 text-muted whitespace-nowrap">
                    {new Date(s.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3 text-muted whitespace-nowrap">
                    {s.last_login_at
                      ? new Date(s.last_login_at).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="sm:hidden divide-y divide-border">
          {data.recentStores.map(s => (
            <li key={s.id} className="p-4 min-w-0">
              <Link href={`/superadmin/clientes/${s.id}`} className="block min-w-0">
                <div className="font-medium break-words">{s.name}</div>
                <div className="text-xs text-muted truncate mt-0.5" title={s.slug}>{s.slug}</div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs capitalize text-muted">{s.plan ?? 'free'}</span>
                  <StatusBadge status={s.subscription_status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
