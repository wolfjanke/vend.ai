import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookies } from '@/lib/auth-session-cookie'
export { dynamic } from '@/lib/route-dynamic'

const DEFAULT_CALLBACK = '/admin'

function resolveCallback(raw: string | null, req: NextRequest): string {
  if (!raw?.trim()) return DEFAULT_CALLBACK
  try {
    const base = new URL(req.url)
    const target = new URL(raw.trim(), base.origin)
    if (target.origin !== base.origin) return DEFAULT_CALLBACK
    const path = `${target.pathname}${target.search}`
    if (path === '/admin' || path.startsWith('/admin?')) return path
    if (path === '/superadmin/login' || path.startsWith('/superadmin/login?')) return path
    return DEFAULT_CALLBACK
  } catch {
    return DEFAULT_CALLBACK
  }
}

/** Encerra sessão e redireciona — sem a página genérica do NextAuth. */
export async function POST(req: NextRequest) {
  let callbackUrl: string | null = null
  try {
    const form = await req.formData()
    callbackUrl = form.get('callbackUrl')?.toString() ?? null
  } catch {
    /* body vazio */
  }

  const destination = resolveCallback(callbackUrl, req)
  const res = NextResponse.redirect(new URL(destination, req.url), { status: 302 })
  clearSessionCookies(res)
  return res
}
