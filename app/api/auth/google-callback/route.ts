import { NextRequest, NextResponse } from 'next/server'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import { recordAdminLogin } from '@/lib/login-alert'
import { resolveRateLimitIp } from '@/lib/rate-limit'
export { dynamic } from '@/lib/route-dynamic'

/** Pós-login Google: envia para onboarding ou painel conforme store_id. */
export async function GET(req: NextRequest) {
  const session = await getSessionSafe()
  const base = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/admin?error=google', base))
  }

  void recordAdminLogin(
    session.user.id,
    session.user.email ?? '',
    resolveRateLimitIp(req),
  )

  if (session.storeId) {
    return NextResponse.redirect(new URL('/admin/dashboard', base))
  }

  const rows = await sql`
    SELECT store_id FROM admin_users WHERE id = ${session.user.id} LIMIT 1
  `
  const storeId = rows[0]?.store_id as string | null | undefined
  if (storeId) {
    return NextResponse.redirect(new URL('/admin/dashboard', base))
  }

  return NextResponse.redirect(new URL('/cadastro/loja', base))
}
