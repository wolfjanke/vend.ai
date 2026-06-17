'use client'

import { useSession } from 'next-auth/react'
import { X } from 'lucide-react'

export default function ImpersonationBanner() {
  const { data: session, update } = useSession()

  if (!session?.impersonating) return null

  async function stop() {
    await update({ stopImpersonation: true })
    window.location.href = '/superadmin/dashboard'
  }

  return (
    <div className="bg-warm/15 border-b border-warm/40 px-4 py-2 flex items-center justify-between gap-2 min-w-0 max-w-[100vw]">
      <p className="text-sm break-words min-w-0">
        Modo edição: você está no painel desta loja. Alterações aparecem na vitrine pública.
      </p>
      <button
        type="button"
        onClick={stop}
        className="shrink-0 flex items-center gap-1 text-sm font-medium min-h-[44px] px-3 rounded-lg hover:bg-warm/20"
      >
        <X size={16} aria-hidden />
        Voltar ao superadmin
      </button>
    </div>
  )
}
