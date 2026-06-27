import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { bumpSessionVersion } from '@/lib/session-version'

/** Incrementa session_version para invalidar JWT ativo antes de limpar cookies. */
export async function revokeSessionFromRequest(req: NextRequest): Promise<void> {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) return

  try {
    const token = await getToken({ req, secret })
    if (token?.sub) {
      await bumpSessionVersion(token.sub as string)
    }
  } catch (e) {
    console.error('[session-logout] revokeSessionFromRequest:', e)
  }
}
