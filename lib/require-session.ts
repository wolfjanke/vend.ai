import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminEmailVerified } from '@/lib/authenticate-admin'

export async function requireSession() {
  const session = await getServerSession(authOptions)
  const expired = session && new Date(session.expires) <= new Date()

  if (!session?.storeId || !session.user?.id || expired) {
    return { session: null, unauthorized: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const verified = await isAdminEmailVerified(session.user.id)
  if (!verified) {
    return {
      session: null,
      unauthorized: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { session, unauthorized: null }
}

/** Sessão autenticada com e-mail verificado (store opcional — ex.: trocar senha). */
export async function requireVerifiedUser() {
  const session = await getServerSession(authOptions)
  const expired = session && new Date(session.expires) <= new Date()

  if (!session?.user?.id || expired) {
    return { session: null, unauthorized: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const verified = await isAdminEmailVerified(session.user.id)
  if (!verified) {
    return {
      session: null,
      unauthorized: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { session, unauthorized: null }
}
