import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isSuperadminEmail } from '@/lib/superadmin-allowlist'

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/superadmin',
    '/superadmin/:path*',
  ],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET

  let token: Awaited<ReturnType<typeof getToken>> = null
  try {
    token = await getToken({ req, secret })
  } catch (e) {
    console.error('[middleware] getToken', e)
  }

  // ─── Superadmin ───────────────────────────────────────────────────────────
  if (pathname.startsWith('/superadmin')) {
    const isLogin = pathname === '/superadmin/login'

    if (isLogin) {
      if (token?.email && isSuperadminEmail(token.email as string)) {
        return NextResponse.redirect(new URL('/superadmin/dashboard', req.url))
      }
      return NextResponse.next()
    }

    if (pathname === '/superadmin') {
      if (token?.email && isSuperadminEmail(token.email as string)) {
        return NextResponse.redirect(new URL('/superadmin/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/superadmin/login', req.url))
    }

    const email = token?.email as string | undefined
    if (!email || !isSuperadminEmail(email)) {
      return NextResponse.redirect(new URL('/superadmin/login', req.url))
    }

    return NextResponse.next()
  }

  // ─── Admin lojista ────────────────────────────────────────────────────────
  const isAdminRoot = pathname === '/admin'
  const isProtectedAdminRoute = pathname.startsWith('/admin/') && pathname !== '/admin'

  const tokenExpired = token?.exp != null && (token.exp as number) * 1000 < Date.now()
  const tokenInvalid = !token?.storeId || token?.sessionRevoked === true || tokenExpired
  const effectiveToken = tokenInvalid ? null : token

  if (isAdminRoot && effectiveToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  if (isProtectedAdminRoute && !effectiveToken) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
}
