import { NextRequest } from 'next/server'
import { handleCheckoutStatus } from '@/lib/checkout/handlers'
export { dynamic } from '@/lib/route-dynamic'

interface RouteParams {
  params: { slug: string; paymentId: string }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const token = req.nextUrl.searchParams.get('token')
  return handleCheckoutStatus(params.slug, params.paymentId, token)
}
