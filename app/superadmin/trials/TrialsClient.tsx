'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'

type Trial = {
  id: string
  name: string
  slug: string
  days_remaining: number
  activation: 'green' | 'yellow' | 'red'
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

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader title="Trials" description="Trials ativos e score de ativação" />

      <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-muted text-left border-b border-border">
              <th className="p-3">Loja</th>
              <th className="p-3">Dias rest.</th>
              <th className="p-3">Ativação</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {trials.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">Nenhum trial ativo</td></tr>
            ) : trials.map(t => (
              <tr key={t.id} className="border-b border-border/50">
                <td className="p-3">
                  <Link href={`/superadmin/clientes/${t.id}`} className="font-medium hover:text-[#FF6B6B] break-words">
                    {t.name}
                  </Link>
                </td>
                <td className="p-3 tabular-nums">{t.days_remaining}d</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-lg ${ACTIVATION_CLASS[t.activation]}`}>
                    {ACTIVATION_LABEL[t.activation]}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => extend(t.id)}
                    className="text-xs text-[#FF6B6B] min-h-[44px] px-2"
                  >
                    +7 dias
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
