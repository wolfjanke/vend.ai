import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookies } from '@/lib/auth-session-cookie'
export { dynamic } from '@/lib/route-dynamic'

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/admin', req.url), { status: 302 })
  clearSessionCookies(res)
  return res
}
