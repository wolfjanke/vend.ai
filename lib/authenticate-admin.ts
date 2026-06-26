import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { normalizeEmail } from '@/lib/email-normalize'

export type AuthenticatedAdmin = {
  id: string
  email: string
  storeId: string
}

async function touchStoreLogin(storeId: string, email: string) {
  try {
    await sql`
      UPDATE stores
      SET last_login_at = NOW(),
          owner_email = COALESCE(owner_email, ${email})
      WHERE id = ${storeId}
    `
  } catch (e) {
    console.error('[auth] touchStoreLogin:', e)
  }
}

/** Valida credenciais de lojista/admin; retorna null se inválidas. */
export async function authenticateAdminUser(
  rawEmail: string,
  password: string,
): Promise<AuthenticatedAdmin | null> {
  const email = normalizeEmail(rawEmail)
  if (!email || !password) return null

  try {
    const rows = await sql`
      SELECT id, email, password_hash, store_id
      FROM admin_users
      WHERE email = ${email}
      LIMIT 1
    `
    const user = rows[0]
    if (!user) return null

    const hash = user.password_hash as string | null
    if (!hash) return null

    const valid = await bcrypt.compare(password, hash)
    if (!valid) return null

    const storeId = user.store_id as string
    if (storeId) {
      await touchStoreLogin(storeId, user.email as string)
    }

    return {
      id: user.id as string,
      email: user.email as string,
      storeId,
    }
  } catch (e) {
    console.error('[auth] authenticateAdminUser:', e)
    return null
  }
}

export async function isAdminEmailVerified(userId: string): Promise<boolean> {
  try {
    const rows = await sql`
      SELECT email_verified_at FROM admin_users WHERE id = ${userId} LIMIT 1
    `
    return Boolean(rows[0]?.email_verified_at)
  } catch (e) {
    console.error('[auth] isAdminEmailVerified:', e)
    return false
  }
}
