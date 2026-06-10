/** Banner informativo — checkout integrado desativado no lançamento. */
export default function CheckoutComingSoonBanner() {
  return (
    <div
      className="mb-4 p-3 sm:p-4 rounded-xl border border-border bg-surface2 text-sm break-words max-w-full"
      role="status"
    >
      <p className="font-syne font-bold text-foreground mb-0.5">
        🔜 Checkout integrado em breve
      </p>
      <p className="text-xs text-muted leading-relaxed">
        Por enquanto, combine o pagamento com seus clientes pelo WhatsApp. Acompanhe as novidades no painel.
      </p>
    </div>
  )
}
