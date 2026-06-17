'use client'

import { ArrowLeft, Gift, MessageCircle, X } from 'lucide-react'
import { RETENTION_BONUS_DAYS } from '@/lib/churn-retention'
import type { PlanSlug } from '@/lib/plans'

interface Props {
  storeName: string
  plan: PlanSlug
  onWhatsApp: () => void
  onContinueCancel: () => void
  onClose: () => void
  busy?: boolean
  error?: string | null
}

export default function CancelRetentionModal({
  storeName,
  plan,
  onWhatsApp,
  onContinueCancel,
  onClose,
  busy = false,
  error = null,
}: Props) {
  const planLabel = plan === 'free' ? 'Grátis' : plan.charAt(0).toUpperCase() + plan.slice(1)

  return (
    <div
      className="fixed inset-0 z-[500] bg-bg/80 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-retention-title"
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[calc(100vh-32px)] overflow-y-auto shadow-xl max-w-[calc(100vw-32px)] sm:max-w-lg">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 border-b border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted hover:text-foreground disabled:opacity-50"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <h2
            id="cancel-retention-title"
            className="font-syne font-bold text-base sm:text-lg text-center flex-1 min-w-0 truncate"
          >
            Cancelar assinatura
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted hover:text-foreground disabled:opacity-50"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {error && (
            <p className="text-sm text-warm px-3 py-2 rounded-xl bg-warm/10 border border-warm/30 break-words">
              {error}
            </p>
          )}
          <div>
            <h3 className="font-syne font-bold text-lg sm:text-xl break-words leading-snug">
              Me ajuda a melhorar o vendai.club?
            </h3>
            <p className="text-sm text-muted mt-2 break-words leading-relaxed">
              Sou quem constrói a plataforma. Antes de você ir, adoraria ouvir o que não funcionou
              — não é pitch de venda, é feedback honesto pra eu saber onde erramos.
            </p>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div
              className="shrink-0 w-11 h-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-syne font-bold text-primary text-sm"
              aria-hidden
            >
              VH
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm">Fundador</div>
              <div className="text-xs text-muted break-words">vendai.club</div>
            </div>
          </div>

          <div className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 flex items-start gap-3 min-w-0">
            <Gift size={18} className="text-primary shrink-0 mt-0.5" aria-hidden />
            <p className="text-sm font-medium text-foreground break-words leading-snug">
              {RETENTION_BONUS_DAYS} dias grátis em troca de um papo rápido no WhatsApp
              <span className="block text-xs font-normal text-muted mt-1">
                Plano {planLabel}
                {storeName.trim() ? ` · ${storeName.trim()}` : ''}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onWhatsApp}
            disabled={busy}
            className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} className="shrink-0" aria-hidden />
            Conversar no WhatsApp
          </button>

          <p className="text-xs text-muted text-center break-words">
            Respondo em até 24h. Os {RETENTION_BONUS_DAYS} dias são concedidos após a conversa.
          </p>

          <button
            type="button"
            onClick={onContinueCancel}
            disabled={busy}
            className="w-full min-h-[44px] px-4 py-2 text-sm font-semibold text-muted hover:text-warm transition-colors disabled:opacity-50"
          >
            Continuar com o cancelamento
          </button>
        </div>
      </div>
    </div>
  )
}
