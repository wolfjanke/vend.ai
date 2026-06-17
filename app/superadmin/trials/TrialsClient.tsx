'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import { superadminCard, superadminLink } from '@/lib/superadmin-ui'

type Trial = {
  id: string
  name: string
  slug: string
  days_remaining: number
  activation: 'green' | 'yellow' | 'red'
  products_added: number
  orders_count: number
  vi_messages_used: number
}

const ACTIVATION_LABEL = {
  green:  'Ativado',
  yellow: 'Parcial',
  red:    'Inativo',
}

const ACTIVATION_CLASS = {
  green:  'bg-green-500/15 text-green-400',
  yellow: 'bg-yellow-500/15 text-yellow-400',
  red:    'bg-red-500/15 text-red-400',
}

export default function TrialsClient() {
  const [trials, setTrials] = useState<Trial[]>([])

  useEffect(() => {
    fetch('/api/superadmin/trials').then(r => r.json()).then(d => setTrials(d.trials ?? []))
  }, [])

  async function extend(id: string) {
    await fetch(`/api/superadmin/clientes/${id}/trial`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 7 }),
    })
    const res = await fetch('/api/superadmin/trials')
    const d = await res.json()
    setTrials(d.trials ?? [])
  }

  const urgent = trials.filter(t => t.days_remaining <= 3).length

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader title="Trials" description="Trials ativos e score de ativação" />

      <p className="text-sm text-muted mb-4 break-words">
        <strong className="text-foreground">{trials.length}</strong> trials ativos
        {urgent > 0 && (
          <> · <strong className="text-warm">{urgent}</strong> expiram em ≤3 dias</>
        )}
      </p>

      <div className={`${superadminCard} overflow-x-auto p-0`}>
        {trials.length === 0 ? (
          <p className="p-6 text-center text-muted text-sm">Nenhum trial ativo</p>
        ) : (
          <>
            <ul className="sm:hidden divide-y divide-border">
              {trials.map(t => (
                <li key={t.id} className="p-4 min-w-0">
                  <Link href={`/superadmin/clientes/${t.id}`} className="font-medium break-words block">
                    {t.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className="tabular-nums">{t.days_remaining}d rest.</span>
                    <span className={`px-2 py-0.5 rounded-lg ${ACTIVATION_CLASS[t.activation]}`}>
                      {ACTIVATION_LABEL[t.activation]}
                    </span>
                    <span className="text-muted">{t.products_added} prod.</span>
                    <span className="text-muted">{t.orders_count} ped.</span>
                    <span className="text-muted">{t.vi_messages_used} Vi</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => extend(t.id)}
                    className={`text-xs ${superadminLink} min-h-[44px] mt-2`}
                  >
                    +7 dias
                  </button>
                </li>
              ))}
            </ul>
            <table className="w-full text-sm min-w-[640px] hidden sm:table">
              <thead>
                <tr className="text-muted text-left border-b border-border">
                  <th className="p-3">Loja</th>
                  <th className="p-3">Dias rest.</th>
                  <th className="p-3">Ativação</th>
                  <th className="p-3">Prod.</th>
                  <th className="p-3">Ped.</th>
                  <th className="p-3">Vi</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {trials.map(t => (
                  <tr key={t.id} className="border-b border-border/50">
                    <td className="p-3">
                      <Link href={`/superadmin/clientes/${t.id}`} className={`font-medium ${superadminLink} break-words`}>
                        {t.name}
                      </Link>
                    </td>
                    <td className="p-3 tabular-nums">{t.days_remaining}d</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${ACTIVATION_CLASS[t.activation]}`}>
                        {ACTIVATION_LABEL[t.activation]}
                      </span>
                    </td>
                    <td className="p-3 tabular-nums">{t.products_added}</td>
                    <td className="p-3 tabular-nums">{t.orders_count}</td>
                    <td className="p-3 tabular-nums">{t.vi_messages_used}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => extend(t.id)}
                        className={`text-xs ${superadminLink} min-h-[44px] px-2`}
                      >
                        +7 dias
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
