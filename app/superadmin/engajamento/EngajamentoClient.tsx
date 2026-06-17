'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import {
  superadminCard,
  superadminChipActive,
  superadminChipInactive,
  superadminLink,
} from '@/lib/superadmin-ui'

type Row = {
  id: string
  name: string
  slug: string
  days_inactive: number | null
  orders_last_30d: number
  vi_messages_used: number
  segment: 'risk' | 'attention' | 'engaged'
}

const SEGMENTS = ['all', 'risk', 'attention', 'engaged'] as const

const SEGMENT = {
  risk:      { label: 'Risco de churn', class: 'text-red-400' },
  attention: { label: 'Atenção', class: 'text-yellow-400' },
  engaged:   { label: 'Engajado', class: 'text-green-400' },
}

export default function EngajamentoClient() {
  const searchParams = useSearchParams()
  const [stores, setStores] = useState<Row[]>([])
  const [segment, setSegment] = useState<string>(searchParams.get('segment') ?? 'all')

  useEffect(() => {
    const s = searchParams.get('segment')
    if (s && SEGMENTS.includes(s as typeof SEGMENTS[number])) setSegment(s)
  }, [searchParams])

  useEffect(() => {
    fetch('/api/superadmin/engajamento').then(r => r.json()).then(d => setStores(d.stores ?? []))
  }, [])

  const filtered = segment === 'all' ? stores : stores.filter(s => s.segment === segment)
  const counts = {
    risk: stores.filter(s => s.segment === 'risk').length,
    attention: stores.filter(s => s.segment === 'attention').length,
    engaged: stores.filter(s => s.segment === 'engaged').length,
  }

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader
        title="Engajamento"
        description="Lojistas ativos por último acesso e pedidos (30d)"
      />

      <p className="text-sm text-muted mb-3 break-words">
        <span className="text-red-400 font-medium">{counts.risk} em risco</span>
        {' · '}
        <span className="text-yellow-400 font-medium">{counts.attention} atenção</span>
        {' · '}
        <span className="text-green-400 font-medium">{counts.engaged} engajados</span>
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {SEGMENTS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setSegment(s)}
            className={`px-3 py-1.5 rounded-lg text-xs min-h-[36px] capitalize ${
              segment === s ? superadminChipActive : superadminChipInactive
            }`}
          >
            {s === 'all' ? 'Todos' : SEGMENT[s as keyof typeof SEGMENT].label}
          </button>
        ))}
      </div>

      <div className={`${superadminCard} overflow-x-auto p-0`}>
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-muted text-sm">Nenhum lojista neste segmento</p>
        ) : (
          <>
            <ul className="sm:hidden divide-y divide-border">
              {filtered.map(s => (
                <li key={s.id} className="p-4 min-w-0">
                  <Link href={`/superadmin/clientes/${s.id}`} className="block min-w-0">
                    <div className="font-medium break-words">{s.name}</div>
                    <div className={`text-xs font-medium mt-1 ${SEGMENT[s.segment].class}`}>
                      {SEGMENT[s.segment].label}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted">
                      <span>{s.days_inactive ?? '—'}d s/ login</span>
                      <span>{s.orders_last_30d} ped. 30d</span>
                      <span>{s.vi_messages_used} Vi</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <table className="w-full text-sm min-w-[560px] hidden sm:table">
              <thead>
                <tr className="text-muted text-left border-b border-border">
                  <th className="p-3">Loja</th>
                  <th className="p-3">Segmento</th>
                  <th className="p-3">Dias s/ login</th>
                  <th className="p-3">Pedidos 30d</th>
                  <th className="p-3">Msgs Vi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="p-3">
                      <Link href={`/superadmin/clientes/${s.id}`} className={`${superadminLink} break-words`}>
                        {s.name}
                      </Link>
                    </td>
                    <td className={`p-3 text-xs font-medium ${SEGMENT[s.segment].class}`}>
                      {SEGMENT[s.segment].label}
                    </td>
                    <td className="p-3 tabular-nums">{s.days_inactive ?? '—'}</td>
                    <td className="p-3 tabular-nums">{s.orders_last_30d}</td>
                    <td className="p-3 tabular-nums">{s.vi_messages_used}</td>
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
