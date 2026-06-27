import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/require-session'
import { logServerError } from '@/lib/logger'
import { AsaasApiError } from '@/lib/payments/wolf-hub'
import { getBillingOwnerPublic, saveBillingOwner } from '@/lib/billing-owner'
export { dynamic } from '@/lib/route-dynamic'

export async function GET() {
  const { session, unauthorized } = await requireSession()
  if (!session) return unauthorized!

  try {
    const data = await getBillingOwnerPublic(session.storeId)
    return NextResponse.json(data)
  } catch (err) {
    logServerError('[GET /api/admin/billing-owner]', err)
    return NextResponse.json({ error: 'Erro ao carregar dados de cobrança' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { session, unauthorized } = await requireSession()
  if (!session) return unauthorized!

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  try {
    const data = await saveBillingOwner(session.storeId, body)
    return NextResponse.json({ ok: true, ...data })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      return NextResponse.json({ error: err.description }, { status: 502 })
    }
    const msg = err instanceof Error ? err.message : 'Erro ao salvar dados de cobrança'
    const status = msg === 'Dados inválidos' || msg.includes('inválid') ? 422 : 500
    logServerError('[PATCH /api/admin/billing-owner]', err)
    return NextResponse.json({ error: msg }, { status })
  }
}
