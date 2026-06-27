import { NextRequest, NextResponse } from 'next/server'
import { getSessionSafe } from '@/lib/auth'
import { adminHasPassword } from '@/lib/google-auth'
export { dynamic } from '@/lib/route-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getSessionSafe()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const hasPassword = await adminHasPassword(session.user.id)
  return NextResponse.json({ hasPassword })
}
