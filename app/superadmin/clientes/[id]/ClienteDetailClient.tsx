'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import StatusBadge from '@/components/superadmin/StatusBadge'
import { PLAN_SLUGS } from '@/lib/plans'
import { superadminBtnOutline, superadminBtnPrimary } from '@/lib/superadmin-ui'

type Props = { id: string }

export default function ClienteDetailClient({ id }: Props) {
  const { update } = useSession()
  const [data, setData] = useState<{
    store: Record<string, unknown>
    metrics: Record<string, unknown>
    billing: Array<Record<string, unknown>>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/superadmin/clientes/${id}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function action(path: string, method: string, body?: object) {
    setBusy(true)
    setMsg('')
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    setBusy(false)
    if (res.ok) {
      setMsg('Atualizado com sucesso.')
      load()
    } else {
      const j = await res.json().catch(() => ({}))
      setMsg(j.error ?? 'Erro na operação.')
    }
  }

  async function impersonate() {
    setBusy(true)
    const res = await fetch(`/api/superadmin/clientes/${id}/impersonate`, { method: 'POST' })
    if (!res.ok) {
      setMsg('Não foi possível iniciar impersonação.')
      setBusy(false)
      return
    }
    await update({ impersonateStoreId: id } as Parameters<typeof update>[0])
    window.location.assign('/admin/dashboard')
  }

  if (loading) return <p className="text-muted text-sm">Carregando…</p>
  if (!data) return <p className="text-warm text-sm">Loja não encontrada.</p>

  const s = data.store
  const slug = String(s.slug ?? '')

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader
        title={String(s.name)}
        description={`/${slug} · ${String(s.owner_email ?? '—')}`}
      />

      {msg && (
        <p className="mb-4 text-sm px-3 py-2 rounded-xl bg-surface2 border border-border break-words">{msg}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <section className="bg-surface border border-border rounded-2xl p-4 min-w-0">
          <h2 className="font-syne font-bold text-sm mb-3">Dados da loja</h2>
          <dl className="text-sm space-y-2 break-words">
            <div><dt className="text-muted">Plano</dt><dd className="capitalize">{String(s.plan)}</dd></div>
            <div><dt className="text-muted">Status</dt><dd><StatusBadge status={s.subscription_status as string} /></dd></div>
            <div><dt className="text-muted">Trial até</dt><dd>{s.trial_ends_at ? new Date(String(s.trial_ends_at)).toLocaleString('pt-BR') : '—'}</dd></div>
            <div><dt className="text-muted">Assinatura desde</dt><dd>{s.subscription_started_at ? new Date(String(s.subscription_started_at)).toLocaleDateString('pt-BR') : '—'}</dd></div>
          </dl>
        </section>

        <section className="bg-surface border border-border rounded-2xl p-4 min-w-0">
          <h2 className="font-syne font-bold text-sm mb-3">Métricas de uso</h2>
          <dl className="text-sm space-y-2">
            <div><dt className="text-muted">Produtos</dt><dd>{Number(data.metrics.product_count)}</dd></div>
            <div><dt className="text-muted">Pedidos</dt><dd>{Number(data.metrics.order_count)}</dd></div>
            <div><dt className="text-muted">Vi (mês)</dt><dd>{Number(s.vi_messages_used ?? 0)} / {Number(data.metrics.vi_limit)}</dd></div>
            <div><dt className="text-muted">Último acesso</dt><dd>{s.last_login_at ? new Date(String(s.last_login_at)).toLocaleString('pt-BR') : '—'}</dd></div>
          </dl>
        </section>
      </div>

      <section className="bg-surface border border-border rounded-2xl p-4 mb-6 min-w-0">
        <h2 className="font-syne font-bold text-sm mb-3">Histórico de cobrança</h2>
        {data.billing.length === 0 ? (
          <p className="text-sm text-muted">Sem registros.</p>
        ) : (
          <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">
            {data.billing.map(b => (
              <li key={String(b.id)} className="flex justify-between gap-2 border-b border-border/40 pb-1">
                <span className="break-words">{String(b.type)} — {String(b.description ?? '')}</span>
                <span className="tabular-nums shrink-0">
                  R$ {(Number(b.amount_cents) / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-surface border border-border rounded-2xl p-4 min-w-0">
        <h2 className="font-syne font-bold text-sm mb-3">Ações</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <select
            className="min-h-[44px] px-3 rounded-xl bg-surface2 border border-border text-sm"
            defaultValue={String(s.plan)}
            onChange={e => action(`/api/superadmin/clientes/${id}/plano`, 'PUT', { plan: e.target.value })}
            disabled={busy}
          >
            {PLAN_SLUGS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            className="min-h-[44px] px-4 rounded-xl bg-surface2 border border-border text-sm"
            onClick={() => action(`/api/superadmin/clientes/${id}/trial`, 'PUT', { days: 7 })}
          >
            Estender trial 7d
          </button>
          <button
            type="button"
            disabled={busy}
            className="min-h-[44px] px-4 rounded-xl bg-surface2 border border-border text-sm"
            onClick={() => action(`/api/superadmin/clientes/${id}/status`, 'PUT', { status: 'OVERDUE' })}
          >
            Suspender (overdue)
          </button>
          <button
            type="button"
            disabled={busy}
            className="min-h-[44px] px-4 rounded-xl bg-surface2 border border-border text-sm"
            onClick={() => action(`/api/superadmin/clientes/${id}/status`, 'PUT', { status: 'ACTIVE' })}
          >
            Reativar
          </button>
          <button
            type="button"
            disabled={busy}
            className="min-h-[44px] px-4 rounded-xl bg-surface2 border border-border text-sm"
            onClick={() => action(`/api/superadmin/clientes/${id}/email`, 'POST')}
          >
            Enviar e-mail
          </button>
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noreferrer"
            className={superadminBtnOutline}
          >
            Acessar loja
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={impersonate}
            className={superadminBtnPrimary}
          >
            Ver no admin como lojista
          </button>
        </div>
      </section>

      <p className="mt-4">
        <Link href="/superadmin/clientes" className="text-sm text-muted hover:text-foreground">← Voltar</Link>
      </p>
    </div>
  )
}
