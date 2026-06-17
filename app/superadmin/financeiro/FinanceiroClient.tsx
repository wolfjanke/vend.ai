'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import SuperadminMetricCard from '@/components/superadmin/SuperadminMetricCard'
import SuperadminDashboardCharts from '@/components/superadmin/SuperadminDashboardCharts'
import { TrendingUp, AlertTriangle } from 'lucide-react'
import { superadminCard, superadminLink } from '@/lib/superadmin-ui'

function formatMonth(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  } catch {
    return iso
  }
}

export default function FinanceiroClient() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetch('/api/superadmin/financeiro').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <p className="text-muted text-sm">Carregando…</p>

  const mrrByPlan = (data.mrrByPlan as Array<{ plan: string; count: number; mrrCents: number }>) ?? []
  const overdue = (data.overdue as Array<{ id: string; name: string; plan: string }>) ?? []
  const revenue = (data.revenueByMonth as Array<{ month: string; total_cents: number }>) ?? []

  const chartData = [...revenue]
    .reverse()
    .map(r => ({
      label: formatMonth(r.month),
      revenue: r.total_cents / 100,
    }))

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader title="Financeiro" description="MRR, receita e inadimplência" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <SuperadminMetricCard icon={<TrendingUp size={22} className="text-warm" />} value={String(data.mrrFormatted)} label="MRR" />
        <SuperadminMetricCard icon={<TrendingUp size={22} />} value={String(data.arrFormatted)} label="ARR" />
        <SuperadminMetricCard
          icon={<AlertTriangle size={22} className="text-warm" />}
          value={Number(data.overdueCount)}
          label="Inadimplentes"
          href="/superadmin/clientes?status=OVERDUE"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <section className={superadminCard}>
          <h2 className="font-syne font-bold text-sm mb-3">MRR por plano</h2>
          <ul className="text-sm space-y-2">
            {mrrByPlan.map(row => (
              <li key={row.plan} className="flex justify-between capitalize gap-2 min-w-0">
                <span className="truncate">{row.plan} ({row.count})</span>
                <span className="tabular-nums shrink-0">R$ {(row.mrrCents / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className={superadminCard}>
          <h2 className="font-syne font-bold text-sm mb-3">Receita (12 meses)</h2>
          <SuperadminDashboardCharts data={chartData} mode="revenue" />
        </section>
      </div>

      <section className={`${superadminCard} overflow-x-auto`}>
        <h2 className="font-syne font-bold text-sm mb-3">Inadimplentes</h2>
        {overdue.length === 0 ? (
          <p className="text-sm text-muted">Nenhum.</p>
        ) : (
          <>
            <ul className="sm:hidden divide-y divide-border/50 -mx-4 sm:mx-0">
              {overdue.map(o => (
                <li key={o.id} className="px-4 py-3 min-w-0">
                  <Link href={`/superadmin/clientes/${o.id}`} className="block">
                    <div className="font-medium break-words">{o.name}</div>
                    <div className="text-xs text-muted capitalize mt-0.5">{o.plan}</div>
                  </Link>
                </li>
              ))}
            </ul>
            <table className="w-full text-sm min-w-[400px] hidden sm:table">
              <thead>
                <tr className="text-muted text-left">
                  <th className="p-2">Loja</th>
                  <th className="p-2">Plano</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {overdue.map(o => (
                  <tr key={o.id} className="border-t border-border/50">
                    <td className="p-2 break-words">{o.name}</td>
                    <td className="p-2 capitalize">{o.plan}</td>
                    <td className="p-2">
                      <Link href={`/superadmin/clientes/${o.id}`} className={`text-xs ${superadminLink}`}>
                        Ver cliente →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  )
}
