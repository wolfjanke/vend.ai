import { Suspense } from 'react'
import ClientesClient from './ClientesClient'

export default function SuperadminClientesPage() {
  return (
    <Suspense fallback={<p className="text-muted text-sm animate-pulse">Carregando…</p>}>
      <ClientesClient />
    </Suspense>
  )
}
