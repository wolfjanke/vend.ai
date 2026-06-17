import { Suspense } from 'react'
import LegacyAdminToLojaRedirect from '@/components/admin/LegacyAdminToLojaRedirect'

/** Legado — redireciona para Minha loja (suporta ?tab= e #hash) */
export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted animate-pulse py-8 text-center">Redirecionando…</p>}>
      <LegacyAdminToLojaRedirect defaultSection="identidade" />
    </Suspense>
  )
}
