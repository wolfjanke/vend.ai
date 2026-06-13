import { notFound, redirect } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { sql } from '@/lib/db'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { isCheckoutEnabledForStore } from '@/lib/checkout-enabled'
import CheckoutPageLayout from '@/components/loja/checkout/CheckoutPageLayout'

interface Props {
  params: { slug: string }
  searchParams: { order?: string; total?: string }
}

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const { slug } = params
  const orderNumber = searchParams.order?.trim()
  const totalParam  = searchParams.total ? Number(searchParams.total) : null

  const rows = await sql`
    SELECT name, whatsapp, logo_url, theme_logo_url, plan,
      asaas_onboarding_status, asaas_wallet_id, is_demo
    FROM stores
    WHERE slug = ${slug}
    LIMIT 1
  `

  const store = rows[0]
  if (!store) notFound()

  if (!isCheckoutEnabledForStore({
    plan:                    (store.plan as string) ?? 'free',
    asaas_onboarding_status: store.asaas_onboarding_status as string | null,
    asaas_wallet_id:         store.asaas_wallet_id as string | null,
    is_demo:                 store.is_demo as boolean | null,
  })) {
    redirect(`/${slug}`)
  }

  const storeName = String(store.name)
  const logo = (store.theme_logo_url ?? store.logo_url) as string | null
  const whatsapp = String(store.whatsapp)

  const totalLabel = totalParam != null && Number.isFinite(totalParam)
    ? totalParam.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null

  const waMessage = orderNumber
    ? `Olá! Acabei de finalizar meu pedido #${orderNumber} pelo site. Pode confirmar?`
    : 'Olá! Acabei de finalizar meu pedido pelo site. Pode confirmar?'

  const whatsappUrl = buildWhatsAppUrl(whatsapp, waMessage)

  return (
    <CheckoutPageLayout storeName={storeName} storeLogo={logo} storeSlug={slug}>
      <div className="max-w-lg mx-auto text-center py-12 px-4">
        <CheckCircle2 size={48} className="mx-auto text-accent mb-4" aria-hidden />
        <h1 className="font-syne font-bold text-xl sm:text-2xl mb-2">Pedido confirmado!</h1>

        {orderNumber && (
          <p className="text-muted text-sm mb-4">
            Número do pedido: <strong className="text-foreground">#{orderNumber}</strong>
          </p>
        )}

        {totalLabel && (
          <p className="text-sm mb-4">
            Valor pago: <strong className="text-accent tabular-nums">{totalLabel}</strong>
          </p>
        )}

        <p className="text-muted text-sm mb-8 break-words leading-relaxed">
          Em breve o lojista entrará em contato para combinar a entrega.
        </p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full sm:w-auto min-h-[44px] px-6 py-3.5 bg-[#25D366] text-white font-syne font-bold text-sm rounded-xl hover:opacity-90 transition-opacity"
        >
          Falar com {storeName} →
        </a>

        <a
          href={`/${slug}`}
          className="block mt-4 text-primary text-sm font-semibold underline underline-offset-2 min-h-[44px] leading-[44px]"
        >
          Voltar à loja
        </a>
      </div>
    </CheckoutPageLayout>
  )
}
