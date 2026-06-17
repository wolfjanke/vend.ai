'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Pencil, ExternalLink } from 'lucide-react'
import { DEMO_STORE_PATH } from '@/lib/demo-store'
import { superadminBtnPrimary, superadminBtnOutline, superadminCard } from '@/lib/superadmin-ui'

type Variant = 'header' | 'card'

type Props = {
  variant?: Variant
}

export default function EditDemoStoreButton({ variant = 'header' }: Props) {
  const { update } = useSession()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function openDemoAdmin() {
    setLoading(true)
    setErr('')
    try {
      const info = await fetch('/api/superadmin/demo-store')
      if (!info.ok) {
        const j = await info.json().catch(() => ({}))
        throw new Error(j.error ?? 'Loja demo não encontrada')
      }
      const { id } = await info.json()
      const res = await fetch(`/api/superadmin/clientes/${id}/impersonate`, { method: 'POST' })
      if (!res.ok) throw new Error('Não foi possível abrir o painel da loja demo')
      await update({ impersonateStoreId: id } as Parameters<typeof update>[0])
      window.location.assign('/admin/dashboard')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao abrir loja demo')
      setLoading(false)
    }
  }

  if (variant === 'card') {
    return (
      <div className={`${superadminCard} flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-warm/5 border-warm/30`}>
        <div className="flex-1 min-w-0">
          <p className="font-syne font-bold text-sm">Loja de demonstração</p>
          <p className="text-xs text-muted mt-1 break-words">
            Edite produtos, aparência e conteúdo da Urban Mix — é o que visitantes veem na landing e na vitrine pública.
          </p>
          {err && <p className="text-xs text-warm mt-2 break-words">{err}</p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <a
            href={DEMO_STORE_PATH}
            target="_blank"
            rel="noreferrer"
            className={`${superadminBtnOutline} gap-1.5`}
          >
            <ExternalLink size={14} aria-hidden />
            Ver vitrine
          </a>
          <button
            type="button"
            onClick={openDemoAdmin}
            disabled={loading}
            className={`${superadminBtnPrimary} gap-1.5 inline-flex items-center justify-center`}
          >
            <Pencil size={14} aria-hidden />
            {loading ? 'Abrindo…' : 'Editar Urban Mix'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <a
        href={DEMO_STORE_PATH}
        target="_blank"
        rel="noreferrer"
        className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs text-muted border border-border rounded-lg hover:border-warm hover:text-warm transition-all min-h-[44px]"
      >
        <ExternalLink size={14} aria-hidden />
        Vitrine demo
      </a>
      <button
        type="button"
        onClick={openDemoAdmin}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-warm/40 bg-warm/10 text-warm rounded-lg hover:bg-warm/20 transition-all min-h-[44px] disabled:opacity-60"
      >
        <Pencil size={14} aria-hidden />
        <span className="hidden sm:inline">{loading ? 'Abrindo…' : 'Editar Urban Mix'}</span>
        <span className="sm:hidden">{loading ? '…' : 'Demo'}</span>
      </button>
    </div>
  )
}
