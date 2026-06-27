import { encode } from 'next-auth/jwt'
import type { AuthenticatedAdmin } from '@/lib/authenticate-admin'
import { SESSION_MAX_AGE_SECONDS } from '@/lib/session-config'
import { getUserSessionVersion } from '@/lib/session-version'

function authSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET não configurado')
  return secret
}

function useSecureCookies(): boolean {
  const url = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  return url.startsWith('https://')
}

export function sessionCookieName(): string {
  return useSecureCookies()
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'
}

/** Gera o valor do cookie de sessão JWT (mesmos claims do callback jwt no login). */
export async function createSessionToken(user: AuthenticatedAdmin): Promise<string> {
  const sessionVer = await getUserSessionVersion(user.id)
  return encode({
    token: {
      sub: user.id,
      email: user.email,
      storeId: user.storeId,
      impersonating: false,
      sessionVer,
    },
    secret: authSecret(),
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export function sessionCookieOptions(): {
  httpOnly: true
  sameSite: 'lax'
  path: '/'
  secure: boolean
  maxAge: number
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: useSecureCookies(),
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}

const SESSION_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
] as const

/** Remove cookies de sessão NextAuth (login por senha ou Google). */
export function clearSessionCookies(res: {
  cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void }
}): void {
  for (const name of SESSION_COOKIE_NAMES) {
    res.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
      secure: name.startsWith('__Secure'),
    })
  }
}

export { SESSION_MAX_AGE_SECONDS } from '@/lib/session-config'
