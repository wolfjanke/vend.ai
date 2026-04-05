import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionSafe } from '@/lib/auth'
import { createSubaccount } from '@/lib/asaas/subaccounts'
import { logServerError } from '@/lib/logger'
import { AsaasApiError } from '@/lib/asaas/client'

const subaccountSchema = z.object({
  name:          z.string().min(2),
  email:         z.string().email(),
  cpfCnpj:       z.string().min(11).max(18),
  birthDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  companyType:   z.enum(['MEI', 'LIMITED', 'INDIVIDUAL', 'ASSOCIATION']),
  phone:         z.string().min(8),
  mobilePhone:   z.string().min(10),
  address:       z.string().min(3),
  addressNumber: z.string().min(1),
  province:      z.string().min(2),
  postalCode:    z.string().min(8).max(9),
})

export async function POST(req: NextRequest) {
  const session = await getSessionSafe()
  if (!session?.storeId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = subaccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const result = await createSubaccount({
      storeId: session.storeId,
      ...parsed.data,
    })

    return NextResponse.json({
      status:   result.status,
      walletId: result.walletId,
    })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      logServerError('[subaccount POST] AsaasApiError', { code: err.code, status: err.status })
      return NextResponse.json(
        { error: err.description, code: err.code },
        { status: err.status >= 400 && err.status < 500 ? err.status : 502 },
      )
    }
    logServerError('[subaccount POST]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
