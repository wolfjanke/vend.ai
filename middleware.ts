import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { buildContentSecurityPolicy, generateCspNonce } from '@/lib/csp'
import { clearSessionCookies } from '@/lib/auth-session-cookie'
import { isSuperadminEmail } from '@/lib/superadmin-allowlist'
import { isAuthTokenRevoked, isJwtExpired } from '@/lib/session-revocation'

export const config = {
  matcher: [
    {
      source:
        '/((?!api|_next/static|_next/image|favicon\\.svg|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}

function createCspContext(req: NextRequest) {
  const dev = process.env.NODE_ENV !== 'production'
  const nonce = generateCspNonce()
  const policy = buildContentSecurityPolicy(nonce, dev)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  return { policy, requestHeaders }
}

function attachCsp(res: NextResponse, policy: string): NextResponse {
  res.headers.set('Content-Security-Policy', policy)
  return res
}

function nextWithCsp(policy: string, requestHeaders: Headers) {
  return attachCsp(
    NextResponse.next({ request: { headers: requestHeaders } }),
    policy,
  )
}

function redirectWithCsp(url: URL, policy: string, requestHeaders: Headers) {
  return attachCsp(
    NextResponse.redirect(url, { headers: requestHeaders }),
    policy,
  )
}

function redirectAndClearSession(
  url: URL,
  policy: string,
  requestHeaders: Headers,
): NextResponse {
  const res = NextResponse.redirect(url, { headers: requestHeaders })
  clearSessionCookies(res)
  return attachCsp(res, policy)
}

export async function middleware(req: NextRequest) {
  const { policy, requestHeaders } = createCspContext(req)
  const { pathname } = req.nextUrl

  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/')
  const isSuperadminArea = pathname === '/superadmin' || pathname.startsWith('/superadmin/')

  if (!isAdminArea && !isSuperadminArea) {
    return nextWithCsp(policy, requestHeaders)
  }

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET

  let token: Awaited<ReturnType<typeof getToken>> = null
  try {
    token = await getToken({ req, secret })
  } catch (e) {
    console.error('[middleware] getToken', e)
  }

  const tokenExpired = isJwtExpired(token?.exp as number | undefined)
  const passwordRevoked = token?.sub ? await isAuthTokenRevoked(token) : false
  const sessionInvalid = tokenExpired || passwordRevoked

  if (passwordRevoked && token?.sub) {
    const loginUrl = pathname.startsWith('/superadmin')
      ? new URL('/superadmin/login', req.url)
      : new URL('/admin?senha=alterada', req.url)
    return redirectAndClearSession(loginUrl, policy, requestHeaders)
  }

  // ─── Superadmin ───────────────────────────────────────────────────────────
  if (pathname.startsWith('/superadmin')) {
    const isLogin = pathname === '/superadmin/login'

    if (isLogin) {
      if (!sessionInvalid && token?.email && isSuperadminEmail(token.email as string)) {
        return redirectWithCsp(new URL('/superadmin/dashboard', req.url), policy, requestHeaders)
      }
      return nextWithCsp(policy, requestHeaders)
    }

    if (pathname === '/superadmin') {
      if (!sessionInvalid && token?.email && isSuperadminEmail(token.email as string)) {
        return redirectWithCsp(new URL('/superadmin/dashboard', req.url), policy, requestHeaders)
      }
      return redirectWithCsp(new URL('/superadmin/login', req.url), policy, requestHeaders)
    }

    const email = token?.email as string | undefined
    if (sessionInvalid || !email || !isSuperadminEmail(email)) {
      return redirectWithCsp(new URL('/superadmin/login', req.url), policy, requestHeaders)
    }

    return nextWithCsp(policy, requestHeaders)
  }

  // ─── Admin lojista ────────────────────────────────────────────────────────
  const isAdminRoot = pathname === '/admin'
  const isProtectedAdminRoute = pathname.startsWith('/admin/') && pathname !== '/admin'

  const sessionRevoked = token?.sessionRevoked === true
  const hasUserSession = Boolean(token?.sub) && !sessionInvalid && !sessionRevoked
  const needsOnboarding = hasUserSession && !token?.storeId
  const tokenInvalid = !token?.storeId || sessionRevoked || sessionInvalid
  const effectiveToken = tokenInvalid ? null : token

  if (needsOnboarding && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return redirectWithCsp(new URL('/cadastro/loja', req.url), policy, requestHeaders)
  }

  if (isAdminRoot && effectiveToken) {
    return redirectWithCsp(new URL('/admin/dashboard', req.url), policy, requestHeaders)
  }

  if (isProtectedAdminRoute && !effectiveToken) {
    return redirectWithCsp(new URL('/admin', req.url), policy, requestHeaders)
  }

  return nextWithCsp(policy, requestHeaders)
}
