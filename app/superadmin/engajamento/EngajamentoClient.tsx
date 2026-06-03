'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'

type Row = {
  id: string
  name: string
  slug: string
  days_inactive: number | null
  orders_last_30d: number
  segment: 'risk' | 'attention' | 'engaged'
}

const SEGMENT = {
  risk:       { label: 'Risco de churn', class: 'text-red-400' },
  attention:  { label: 'Atenção', class: 'text-yellow-400' },
  engaged:    { label: 'Engajado', class: 'text-green-400' },
}

export default function EngajamentoClient() {
  const [stores, setStores] = useState<Row[]>([])

  useEffect(() => {
    fetch('/api/superadmin/engajamento').then(r => r.json()).then(d => setStores(d.stores ?? []))
  }, [])

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader
        title="Engajamento"
        description="Lojistas ativos por último acesso e pedidos (30d)"
      />

      <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-muted text-left border-b border-border">
              <th className="p-3">Loja</th>
              <th className="p-3">Segmento</th>
              <th className="p-3">Dias s/ login</th>
              <th className="p-3">Pedidos 30d</th>
            </tr>
          </thead>
          <tbody>
            {stores.map(s => (
              <tr key={s.id} className="border-b border-border/50">
                <td className="p-3">
                  <Link href={`/superadmin/clientes/${s.id}`} className="hover:text-[#FF6B6B] break-words">
                    {s.name}
                  </Link>
                </td>
                <td className={`p-3 text-xs font-medium ${SEGMENT[s.segment].class}`}>
                  {SEGMENT[s.segment].label}
                </td>
                <td className="p-3 tabular-nums">{s.days_inactive ?? '—'}</td>
                <td className="p-3 tabular-nums">{s.orders_last_30d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
