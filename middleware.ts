import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
  ],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  let token: Awaited<ReturnType<typeof getToken>> = null
  try {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    })
  } catch (e) {
    console.error('[middleware] getToken', e)
  }

  const isAdminRoot = pathname === '/admin'
  const isProtectedAdminRoute = pathname.startsWith('/admin/') && pathname !== '/admin'

  if (isAdminRoot && token) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  if (isProtectedAdminRoute && !token) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
}
