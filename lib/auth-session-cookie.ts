import { encode } from 'next-auth/jwt'
import type { AuthenticatedAdmin } from '@/lib/authenticate-admin'

function authSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET não configurado')
  return secret
}

function sessionMaxAge(): number {
  return 7 * 24 * 60 * 60
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
  return encode({
    token: {
      sub: user.id,
      email: user.email,
      storeId: user.storeId,
      impersonating: false,
    },
    secret: authSecret(),
    maxAge: sessionMaxAge(),
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
    maxAge: sessionMaxAge(),
  }
}
