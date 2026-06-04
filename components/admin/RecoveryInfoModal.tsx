'use client'

import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'

export default function RecoveryInfoModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors min-h-[44px] px-1 -ml-1"
        aria-label="O que é recuperação de pedidos?"
      >
        <Info size={16} className="text-primary shrink-0" />
        O que é isso?
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-bg/80"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-5 w-full max-w-md shadow-xl max-h-[calc(100vh-32px)] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-syne font-bold text-base text-foreground mb-3">Recuperação de pedidos</h3>
            <p className="text-sm text-muted leading-relaxed mb-3">
              Quando um cliente inicia um pedido mas não finaliza, ele fica como <strong className="text-foreground">Novo</strong> na
              lista. Após 24 horas, você pode enviar uma mensagem pelo WhatsApp para lembrar o cliente — isso ajuda a recuperar
              vendas que estavam quase fechadas.
            </p>
            <p className="text-sm text-muted leading-relaxed mb-5">
              Este recurso está disponível nos planos <strong className="text-foreground">Pro</strong> e{' '}
              <strong className="text-foreground">Loja</strong>. No plano Grátis ou Starter ele não aparece aqui.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full min-h-[44px] rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  )
}
