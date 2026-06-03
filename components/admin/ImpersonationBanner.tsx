'use client'

import { useSession } from 'next-auth/react'
import { X } from 'lucide-react'

export default function ImpersonationBanner() {
  const { data: session, update } = useSession()

  if (!session?.impersonating) return null

  async function stop() {
    await update({ stopImpersonation: true })
    window.location.href = '/superadmin/clientes'
  }

  return (
    <div className="bg-[#FF6B6B]/15 border-b border-[#FF6B6B]/40 px-4 py-2 flex items-center justify-between gap-2 min-w-0 max-w-[100vw]">
      <p className="text-sm break-words min-w-0">
        Modo suporte: você está vendo o painel desta loja como lojista.
      </p>
      <button
        type="button"
        onClick={stop}
        className="shrink-0 flex items-center gap-1 text-sm font-medium min-h-[44px] px-3 rounded-lg hover:bg-[#FF6B6B]/20"
      >
        <X size={16} aria-hidden />
        Sair da loja
      </button>
    </div>
  )
}
