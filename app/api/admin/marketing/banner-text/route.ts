import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSession } from '@/lib/require-session'
import { checkStoreRateLimit } from '@/lib/rate-limit-helpers'
import { BANNER_TEXT_STORE_LIMIT, BANNER_TEXT_STORE_WINDOW_MS } from '@/lib/rate-limit-config'
import { generateBannerTexts } from '@/lib/banner-ai'
import { logServerError } from '@/lib/logger'
import { sql } from '@/lib/db'
export { dynamic } from '@/lib/route-dynamic'

const couponSchema = z.object({
  id:               z.string(),
  code:             z.string(),
  type:             z.enum(['percent', 'fixed']),
  value:            z.number(),
  active:           z.boolean(),
  startDate:        z.string().optional(),
  endDate:          z.string().optional(),
  minOrderValue:    z.number().optional(),
  maxDiscountValue: z.number().optional(),
})

const bodySchema = z.object({
  hint:               z.string().max(120).optional(),
  startDate:          z.string().optional(),
  endDate:            z.string().optional(),
  pixDiscountPercent: z.number().min(0).max(100).optional(),
  couponRules:        z.array(couponSchema).optional(),
  freteInfo:          z.string().max(500).optional(),
  freeShippingMin:    z.number().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { session, unauthorized } = await requireSession()
    if (!session) return unauthorized!

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Geração por IA indisponível no momento.' }, { status: 503 })
    }

    if (!(await checkStoreRateLimit(
      'banner:text',
      session.storeId,
      BANNER_TEXT_STORE_LIMIT,
      BANNER_TEXT_STORE_WINDOW_MS,
    ))) {
      return NextResponse.json({ error: 'Limite de 10 gerações por hora atingido.' }, { status: 429 })
    }

    const storeRows = await sql`SELECT name FROM stores WHERE id = ${session.storeId} LIMIT 1`
    const storeName = String(storeRows[0]?.name ?? 'Loja')

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
    }

    const result = await generateBannerTexts({
      storeName,
      hint:               parsed.data.hint,
      startDate:          parsed.data.startDate,
      endDate:            parsed.data.endDate,
      pixDiscountPercent: parsed.data.pixDiscountPercent,
      couponRules:        parsed.data.couponRules,
      freteInfo:          parsed.data.freteInfo,
      freeShippingMin:    parsed.data.freeShippingMin,
    })

    return NextResponse.json(result)
  } catch (error) {
    logServerError('[POST /api/admin/marketing/banner-text]', error)
    const msg = error instanceof Error ? error.message : 'Erro ao gerar texto'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
