'use client'

import { useEffect, useState } from 'react'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import SuperadminMetricCard from '@/components/superadmin/SuperadminMetricCard'
import { TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function FinanceiroClient() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetch('/api/superadmin/financeiro').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <p className="text-muted text-sm">Carregando…</p>

  const mrrByPlan = (data.mrrByPlan as Array<{ plan: string; count: number; mrrCents: number }>) ?? []
  const overdue = (data.overdue as Array<Record<string, unknown>>) ?? []
  const revenue = (data.revenueByMonth as Array<{ month: string; total_cents: number }>) ?? []

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader title="Financeiro" description="MRR, receita e inadimplência" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SuperadminMetricCard icon={<TrendingUp size={22} style={{ color: '#FF6B6B' }} />} value={String(data.mrrFormatted)} label="MRR" />
        <SuperadminMetricCard icon={<TrendingUp size={22} />} value={String(data.arrFormatted)} label="ARR" />
        <SuperadminMetricCard icon={<AlertTriangle size={22} className="text-warm" />} value={Number(data.overdueCount)} label="Inadimplentes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <section className="bg-surface border border-border rounded-2xl p-4">
          <h2 className="font-syne font-bold text-sm mb-3">MRR por plano</h2>
          <ul className="text-sm space-y-2">
            {mrrByPlan.map(row => (
              <li key={row.plan} className="flex justify-between capitalize">
                <span>{row.plan} ({row.count})</span>
                <span className="tabular-nums">R$ {(row.mrrCents / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="bg-surface border border-border rounded-2xl p-4">
          <h2 className="font-syne font-bold text-sm mb-3">Receita (12 meses)</h2>
          <ul className="text-sm space-y-2 max-h-64 overflow-y-auto">
            {revenue.map(r => (
              <li key={r.month} className="flex justify-between">
                <span>{new Date(r.month).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                <span className="tabular-nums">R$ {(r.total_cents / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-surface border border-border rounded-2xl p-4 overflow-x-auto">
        <h2 className="font-syne font-bold text-sm mb-3">Inadimplentes</h2>
        {overdue.length === 0 ? (
          <p className="text-sm text-muted">Nenhum.</p>
        ) : (
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="text-muted text-left">
                <th className="p-2">Loja</th>
                <th className="p-2">Plano</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {overdue.map((o, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="p-2 break-words">{String(o.name)}</td>
                  <td className="p-2 capitalize">{String(o.plan)}</td>
                  <td className="p-2">
                    <Link href={`/superadmin/clientes`} className="text-[#FF6B6B] text-xs">Ver clientes</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
