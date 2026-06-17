'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import StatusBadge from '@/components/superadmin/StatusBadge'
import {
  superadminCard,
  superadminChipActive,
  superadminChipInactive,
  superadminLink,
} from '@/lib/superadmin-ui'
import { isDemoStoreSlug } from '@/lib/demo-store'

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
  is_demo?: boolean
}

const PLANS = ['all', 'free', 'starter', 'pro', 'loja', 'enterprise']
const STATUSES = ['all', 'ACTIVE', 'TRIAL', 'OVERDUE', 'CANCELLED']

export default function ClientesClient() {
  const searchParams = useSearchParams()
  const [stores, setStores] = useState<StoreRow[]>([])
  const [plan, setPlan] = useState(searchParams.get('plan') ?? 'all')
  const [status, setStatus] = useState(searchParams.get('status') ?? 'all')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const p = searchParams.get('plan')
    const s = searchParams.get('status')
    if (p) setPlan(p)
    if (s) setStatus(s)
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const params = new URLSearchParams()
      if (plan !== 'all') params.set('plan', plan)
      if (status !== 'all') params.set('status', status)
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/superadmin/clientes?${params}`)
      const data = await res.json()
      if (!cancelled) {
        setStores(data.stores ?? [])
        setLoading(false)
      }
    }
    const t = setTimeout(load, 300)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [plan, status, q])

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
                plan === p ? superadminChipActive : superadminChipInactive
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
                status === s ? superadminChipActive : superadminChipInactive
              }`}
            >
              {s === 'all' ? 'Todos status' : s}
            </button>
          ))}
        </div>
      </div>

      <div className={`${superadminCard} overflow-hidden p-0`}>
        {loading ? (
          <p className="p-6 text-muted text-center text-sm">Carregando…</p>
        ) : stores.length === 0 ? (
          <p className="p-6 text-muted text-center text-sm">Nenhum cliente</p>
        ) : (
          <>
            <ul className="sm:hidden divide-y divide-border">
              {stores.map(s => (
                <li key={s.id} className="p-4 min-w-0">
                  <Link href={`/superadmin/clientes/${s.id}`} className="block min-w-0">
                    <div className="font-medium break-words">{s.name}</div>
                    <div className="text-xs text-muted truncate mt-0.5" title={s.slug}>{s.slug}</div>
                    {(s.is_demo || isDemoStoreSlug(s.slug)) && (
                      <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-warm/15 text-warm border border-warm/30">
                        Loja demo
                      </span>
                    )}
                    {s.owner_email && (
                      <div className="text-xs text-muted break-all mt-0.5">{s.owner_email}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className="capitalize text-muted">{s.plan}</span>
                      <StatusBadge status={s.subscription_status} />
                      <span className="text-muted">{s.product_count} prod.</span>
                      <span className="text-muted">{s.order_count} ped.</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-muted border-b border-border text-left">
                    <th className="p-3">Loja</th>
                    <th className="p-3">E-mail</th>
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
                  {stores.map(s => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-surface2/30">
                      <td className="p-3 min-w-0">
                        <div className="font-medium break-words">{s.name}</div>
                        <div className="text-xs text-muted truncate" title={s.slug}>{s.slug}</div>
                        {(s.is_demo || isDemoStoreSlug(s.slug)) && (
                          <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-warm/15 text-warm border border-warm/30">
                            Loja demo
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted break-all max-w-[160px]">
                        {s.owner_email ?? '—'}
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
                        <Link
                          href={`/superadmin/clientes/${s.id}`}
                          className={`${superadminLink} text-xs font-medium min-h-[44px] inline-flex items-center`}
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
