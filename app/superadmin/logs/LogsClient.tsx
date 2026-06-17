'use client'

import { useCallback, useEffect, useState } from 'react'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import { superadminCard, superadminChipActive, superadminChipInactive } from '@/lib/superadmin-ui'

type Event = { id: string; type: string; title: string; at: string; meta?: string }

export default function LogsClient() {
  const [events, setEvents] = useState<Event[]>([])
  const [type, setType] = useState('all')
  const [window, setWindow] = useState('7d')

  const load = useCallback(() => {
    fetch(`/api/superadmin/logs?type=${type}&window=${window}`)
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
  }, [type, window])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader title="Logs" description="Auditoria e eventos do sistema" />

      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'signup', 'payment', 'webhook'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs min-h-[36px] ${
              type === t ? superadminChipActive : superadminChipInactive
            }`}
          >
            {t === 'all' ? 'Todos' : t}
          </button>
        ))}
        {['24h', '7d', '30d'].map(w => (
          <button
            key={w}
            type="button"
            onClick={() => setWindow(w)}
            className={`px-3 py-1.5 rounded-lg text-xs min-h-[36px] ${
              window === w ? superadminChipActive : superadminChipInactive
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      <ul className={`${superadminCard} divide-y divide-border max-h-[70vh] overflow-y-auto p-0`}>
        {events.length === 0 ? (
          <li className="p-6 text-sm text-muted text-center">Nenhum evento</li>
        ) : events.map(e => (
          <li key={e.id} className="p-3 text-sm flex flex-col sm:flex-row sm:justify-between gap-1 min-w-0">
            <div className="min-w-0">
              <span className="text-xs text-muted uppercase mr-2">{e.type}</span>
              <span className="break-words">{e.title}</span>
              {e.meta && <span className="text-muted text-xs ml-2">{e.meta}</span>}
            </div>
            <time className="text-xs text-muted shrink-0">
              {new Date(e.at).toLocaleString('pt-BR')}
            </time>
          </li>
        ))}
      </ul>
    </div>
  )
}
