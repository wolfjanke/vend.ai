import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookies } from '@/lib/auth-session-cookie'
import { revokeSessionFromRequest } from '@/lib/session-logout'
export { dynamic } from '@/lib/route-dynamic'

/** Invalida JWT no servidor e limpa cookies (logout programático). */
export async function POST(req: NextRequest) {
  await revokeSessionFromRequest(req)
  const res = NextResponse.json({ ok: true })
  clearSessionCookies(res)
  return res
}
