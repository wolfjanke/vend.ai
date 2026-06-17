import { Suspense } from 'react'
import EngajamentoClient from './EngajamentoClient'

export default function SuperadminEngajamentoPage() {
  return (
    <Suspense fallback={<p className="text-muted text-sm animate-pulse">Carregando…</p>}>
      <EngajamentoClient />
    </Suspense>
  )
}
