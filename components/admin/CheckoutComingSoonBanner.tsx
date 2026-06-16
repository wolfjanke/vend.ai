import { Clock } from 'lucide-react'

/** Banner informativo — checkout integrado desativado no lançamento. */
export default function CheckoutComingSoonBanner() {
  return (
    <div
      className="mb-4 p-3 sm:p-4 rounded-xl border border-border bg-surface2 text-sm break-words max-w-full"
      role="status"
    >
      <p className="font-syne font-bold text-foreground mb-0.5 flex items-center gap-2">
        <Clock size={16} className="shrink-0 text-muted" aria-hidden />
        Checkout integrado em breve
      </p>
      <p className="text-xs text-muted leading-relaxed">
        Por enquanto, combine o pagamento com seus clientes pelo WhatsApp. Checkout com cartão na loja em breve.
      </p>
    </div>
  )
}
