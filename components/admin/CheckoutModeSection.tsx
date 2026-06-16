'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CheckoutMode } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import { isPlanCheckoutEligible } from '@/lib/plans'
import SectionHeader from '@/components/admin/SectionHeader'
import CheckoutComingSoonBanner from '@/components/admin/CheckoutComingSoonBanner'

interface Props {
  plan:                    PlanSlug
  checkoutMode:            CheckoutMode
  checkoutEligible:        boolean
  checkoutLaunchEnabled?:  boolean
}

const OPTIONS: {
  value: CheckoutMode
  title: string
  description: string
  requiresCheckout: boolean
}[] = [
  {
    value: 'whatsapp_and_checkout',
    title: 'WhatsApp + Checkout',
    description: 'Cliente escolhe como quer pagar na loja.',
    requiresCheckout: true,
  },
  {
    value: 'whatsapp_only',
    title: 'Só WhatsApp',
    description: 'Pedidos sempre pelo WhatsApp. Indicado para atendimento pessoal.',
    requiresCheckout: false,
  },
  {
    value: 'checkout_only',
    title: 'Só Checkout',
    description: 'Apenas pagamento pelo site. WhatsApp disponível para dúvidas.',
    requiresCheckout: true,
  },
]

export default function CheckoutModeSection({
  plan,
  checkoutMode,
  checkoutEligible,
  checkoutLaunchEnabled = false,
}: Props) {
  const [mode, setMode] = useState<CheckoutMode>(checkoutMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const paidPlan = isPlanCheckoutEligible(plan)

  async function selectMode(next: CheckoutMode) {
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/store/checkout-mode', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ checkout_mode: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Não foi possível salvar.')
        return
      }
      setMode(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  if (!checkoutLaunchEnabled) {
    return (
      <>
        <SectionHeader title="Pedidos e pagamentos" description="Como seus clientes finalizam compras na loja." />
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm break-words">
            <p className="font-semibold text-foreground mb-1">Pedidos pelo WhatsApp</p>
            <p className="text-muted text-xs leading-relaxed">
              Todos os pedidos são finalizados pelo WhatsApp. Configure chave PIX e links de pagamento em Configurações → Venda.
            </p>
          </div>
          <CheckoutComingSoonBanner />
        </div>
      </>
    )
  }

  return (
    <>
      <SectionHeader title="Pedidos e pagamentos" description="Como seus clientes finalizam compras na loja." />
      <div className="space-y-3">
        {!paidPlan ? (
          <div className="rounded-xl border border-border bg-surface2 p-4 text-sm break-words">
            <p className="font-semibold text-foreground mb-1">Só WhatsApp</p>
            <p className="text-muted text-xs leading-relaxed mb-3">
              No plano Grátis, pedidos são combinados pelo WhatsApp.
            </p>
            <Link
              href="/admin/plano"
              className="inline-flex min-h-[44px] items-center px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90"
            >
              Fazer upgrade →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted break-words">Como receber pedidos</p>
            <div className="flex flex-col gap-2">
              {OPTIONS.map(opt => {
                const disabled = opt.requiresCheckout && !checkoutEligible
                const checked = mode === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 min-h-[44px] p-3 rounded-xl border transition-colors ${
                      checked ? 'border-primary bg-primary/5' : 'border-border bg-surface2'
                    } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={disabled ? 'Configure seu CNPJ para ativar' : undefined}
                  >
                    <input
                      type="radio"
                      name="checkout_mode"
                      className="mt-1 size-4 shrink-0 accent-primary"
                      checked={checked}
                      disabled={disabled || loading}
                      onChange={() => { if (!disabled) void selectMode(opt.value) }}
                    />
                    <span className="text-sm min-w-0">
                      <span className="font-semibold text-foreground block">{opt.title}</span>
                      <span className="text-xs text-muted block break-words">{opt.description}</span>
                      {disabled && (
                        <span className="text-[11px] text-warm block mt-1">
                          Configure seu CNPJ em Como receber para ativar.
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
            {!checkoutEligible && (
              <Link
                href="/admin/pagamentos"
                className="inline-flex text-xs text-primary font-semibold hover:underline"
              >
                Configurar recebimento por cartão →
              </Link>
            )}
          </>
        )}
        {error && <p className="text-xs text-warm break-words">{error}</p>}
        {saved && <p className="text-xs text-accent">Modo de recebimento atualizado.</p>}
      </div>
    </>
  )
}
