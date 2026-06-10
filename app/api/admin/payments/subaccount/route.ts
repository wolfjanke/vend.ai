import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionSafe } from '@/lib/auth'
import { createSubaccount } from '@/lib/asaas/subaccounts'
import { logServerError } from '@/lib/logger'
import { AsaasApiError } from '@/lib/asaas/client'
import { digitsOnly, isValidCnpj } from '@/lib/masks'
export { dynamic } from '@/lib/route-dynamic'

const pjCompanyTypes = ['LIMITED', 'INDIVIDUAL', 'ASSOCIATION'] as const

const subaccountSchema = z
  .object({
    accountKind: z.enum(['mei', 'pj']),
    name:          z.string().min(2),
    email:         z.string().email(),
    cpfCnpj:       z.string().min(14),
    birthDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    companyType:   z.enum(['MEI', 'LIMITED', 'INDIVIDUAL', 'ASSOCIATION']).optional(),
    phone:         z.string().optional(),
    mobilePhone:   z.string().min(10),
    address:       z.string().min(3),
    addressNumber: z.string().min(1),
    province:      z.string().min(2),
    postalCode:    z.string().min(8).max(9),
  })
  .superRefine((data, ctx) => {
    const doc = digitsOnly(data.cpfCnpj)
    if (doc.length !== 14 || !isValidCnpj(doc)) {
      ctx.addIssue({
        code:    'custom',
        path:    ['cpfCnpj'],
        message: 'Informe um CNPJ válido. O Asaas exige CNPJ para ativar recebimentos (MEI ou empresa).',
      })
    }
    if (data.accountKind === 'pj' && !data.companyType) {
      ctx.addIssue({
        code:    'custom',
        path:    ['companyType'],
        message: 'Selecione o tipo de empresa.',
      })
    }
    if (data.accountKind === 'pj' && data.companyType && !pjCompanyTypes.includes(data.companyType as typeof pjCompanyTypes[number])) {
      ctx.addIssue({
        code:    'custom',
        path:    ['companyType'],
        message: 'Tipo de empresa inválido para pessoa jurídica.',
      })
    }
    const mobile = digitsOnly(data.mobilePhone)
    if (mobile.length < 10 || mobile.length > 11) {
      ctx.addIssue({
        code:    'custom',
        path:    ['mobilePhone'],
        message: 'Celular inválido.',
      })
    }
    const cep = digitsOnly(data.postalCode)
    if (cep.length !== 8) {
      ctx.addIssue({
        code:    'custom',
        path:    ['postalCode'],
        message: 'CEP inválido.',
      })
    }
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
    const msg =
      process.env.NODE_ENV === 'production'
        ? 'Dados inválidos'
        : (parsed.error.issues[0]?.message ?? Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Dados inválidos')
    return NextResponse.json({ error: msg }, { status: 422 })
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
