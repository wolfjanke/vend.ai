import { Suspense } from 'react'
import ConfiguracoesClient from './ConfiguracoesClient'

export default function SuperadminConfiguracoesPage() {
  return (
    <Suspense fallback={<p className="text-muted text-sm animate-pulse">Carregando…</p>}>
      <ConfiguracoesClient />
    </Suspense>
  )
}
