import { NextRequest, NextResponse } from 'next/server'
import { requireVerifiedUser } from '@/lib/require-session'
import { adminHasPassword } from '@/lib/google-auth'
export { dynamic } from '@/lib/route-dynamic'

export async function GET(_req: NextRequest) {
  const { session, unauthorized } = await requireVerifiedUser()
  if (!session) return unauthorized!

  const hasPassword = await adminHasPassword(session.user.id)
  return NextResponse.json({ hasPassword })
}
