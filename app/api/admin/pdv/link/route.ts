import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionSafe } from '@/lib/auth'
import { createPdvPaymentLink } from '@/lib/asaas/payments'
import { calculateInstallmentQuote } from '@/lib/payments/installment-fees'
import { logServerError } from '@/lib/logger'
import { AsaasApiError } from '@/lib/asaas/client'
import type { Store, PlanSlug } from '@/types'
import { canUsePdvForStore } from '@/lib/store-plan-access'
export { dynamic } from '@/lib/route-dynamic'


export async function POST(req: NextRequest) {
  const session = await getSessionSafe()
  if (!session?.storeId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { customer_name, customer_phone, total, items = [] } = body

  if (!total || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'total e items são obrigatórios' }, { status: 422 })
  }

  const storeRows = await sql`
    SELECT id, plan, asaas_wallet_id, asaas_onboarding_status, is_demo, slug
    FROM stores WHERE id = ${session.storeId} LIMIT 1
  `
  const store = storeRows[0] as Store & { id: string; is_demo?: boolean; slug?: string } | undefined

  if (!store || !canUsePdvForStore(store)) {
    return NextResponse.json({ error: 'PDV disponível apenas no plano Loja' }, { status: 403 })
  }

  if (!store.asaas_wallet_id || store.asaas_onboarding_status !== 'APPROVED') {
    return NextResponse.json({ error: 'Pagamentos não disponíveis — configure o cadastro em Pagamentos' }, { status: 403 })
  }

  const plan  = (store.plan ?? 'free') as PlanSlug
  const quote = calculateInstallmentQuote(Number(total), 1, plan)

  try {
    const result = await createPdvPaymentLink(
      store,
      quote,
      1,
      {
        name:        String(customer_name || 'Cliente PDV'),
        mobilePhone: customer_phone ? String(customer_phone) : undefined,
      },
    )

    return NextResponse.json({
      asaas_payment_id: result.asaas_payment_id,
      invoiceUrl:       result.invoiceUrl,
    })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      logServerError('[pdv/link] AsaasApiError', { code: err.code })
      return NextResponse.json({ error: err.description }, { status: 502 })
    }
    logServerError('[pdv/link]', err)
    return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 })
  }
}
