'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import StatusBadge from '@/components/superadmin/StatusBadge'

type StoreRow = {
  id: string
  name: string
  slug: string
  plan: string
  subscription_status: string | null
  product_count: number
  order_count: number
  created_at: string
  last_login_at: string | null
  owner_email: string | null
}

const PLANS = ['all', 'free', 'starter', 'pro', 'loja', 'enterprise']
const STATUSES = ['all', 'ACTIVE', 'TRIAL', 'OVERDUE', 'CANCELLED']

export default function ClientesClient() {
  const [stores, setStores] = useState<StoreRow[]>([])
  const [plan, setPlan] = useState('all')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (plan !== 'all') params.set('plan', plan)
    if (status !== 'all') params.set('status', status)
    if (q.trim()) params.set('q', q.trim())
    const res = await fetch(`/api/superadmin/clientes?${params}`)
    const data = await res.json()
    setStores(data.stores ?? [])
    setLoading(false)
  }, [plan, status, q])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader title="Clientes" description="Todos os lojistas da plataforma" />

      <div className="flex flex-col gap-3 mb-4">
        <input
          type="search"
          placeholder="Buscar nome, slug ou e-mail…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full min-h-[44px] px-4 rounded-xl bg-surface2 border border-border text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {PLANS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={`px-3 py-1.5 rounded-lg text-xs min-h-[36px] capitalize ${
                plan === p ? 'bg-[#FF6B6B]/20 border border-[#FF6B6B]/40' : 'bg-surface2 border border-border'
              }`}
            >
              {p === 'all' ? 'Todos planos' : p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs min-h-[36px] ${
                status === s ? 'bg-[#FF6B6B]/20 border border-[#FF6B6B]/40' : 'bg-surface2 border border-border'
              }`}
            >
              {s === 'all' ? 'Todos status' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-muted border-b border-border text-left">
                <th className="p-3">Loja</th>
                <th className="p-3">Plano</th>
                <th className="p-3">Status</th>
                <th className="p-3">Prod.</th>
                <th className="p-3">Ped.</th>
                <th className="p-3">Criado</th>
                <th className="p-3">Acesso</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-6 text-muted text-center">Carregando…</td></tr>
              ) : stores.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-muted text-center">Nenhum cliente</td></tr>
              ) : stores.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-surface2/30">
                  <td className="p-3 min-w-0">
                    <div className="font-medium break-words">{s.name}</div>
                    <div className="text-xs text-muted truncate" title={s.slug}>{s.slug}</div>
                  </td>
                  <td className="p-3 capitalize">{s.plan}</td>
                  <td className="p-3"><StatusBadge status={s.subscription_status} /></td>
                  <td className="p-3 tabular-nums">{s.product_count}</td>
                  <td className="p-3 tabular-nums">{s.order_count}</td>
                  <td className="p-3 text-muted whitespace-nowrap">
                    {new Date(s.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3 text-muted whitespace-nowrap">
                    {s.last_login_at ? new Date(s.last_login_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="p-3">
                    <Link href={`/superadmin/clientes/${s.id}`} className="text-[#FF6B6B] text-xs font-medium min-h-[44px] inline-flex items-center">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
