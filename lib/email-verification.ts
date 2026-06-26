import crypto from 'crypto'
import { sql } from '@/lib/db'
import { sendEmailVerificationEmail } from '@/lib/email/send-email-verification'
import { logServerError } from '@/lib/logger'
import { normalizeEmail } from '@/lib/email-normalize'

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

/** Cria token de verificação e envia e-mail. */
export async function createAndSendEmailVerification(
  userId: string,
  email: string,
): Promise<{ success: boolean }> {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS)

  await sql`DELETE FROM email_verification_tokens WHERE user_id = ${userId}`
  await sql`
    INSERT INTO email_verification_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expires.toISOString()})
  `

  const verifyUrl = `${appBaseUrl()}/verificar-email?token=${encodeURIComponent(token)}`
  const sent = await sendEmailVerificationEmail(email, verifyUrl)
  if (!sent.success) {
    logServerError('[email-verification] falha ao enviar', sent.error)
    return { success: false }
  }
  return { success: true }
}

export type VerifiedUser = {
  userId: string
  email: string
  storeId: string
  storeSlug: string
  storeName: string
  ownerName: string
  termsVersion: string
  termsAcceptedAt: string
  termsAcceptedIp: string
}

/** Marca e-mail como verificado; retorna dados da loja ou null se token inválido. */
export async function verifyEmailByToken(token: string): Promise<VerifiedUser | null> {
  const rows = await sql`
    SELECT t.id AS token_id, t.user_id, t.expires_at, t.used_at,
           u.email, u.store_id, u.email_verified_at,
           s.slug, s.name AS store_name, s.settings_json,
           s.terms_version, s.terms_accepted_at, s.terms_accepted_ip
    FROM email_verification_tokens t
    JOIN admin_users u ON u.id = t.user_id
    LEFT JOIN stores s ON s.id = u.store_id
    WHERE t.token = ${token}
    LIMIT 1
  `

  const row = rows[0] as {
    token_id: string
    user_id: string
    expires_at: string
    used_at: string | null
    email: string
    store_id: string | null
    email_verified_at: string | null
    slug: string | null
    store_name: string | null
    settings_json: { ownerName?: string } | null
    terms_version: string | null
    terms_accepted_at: string | null
    terms_accepted_ip: string | null
  } | undefined

  if (!row || row.used_at) return null
  if (new Date(row.expires_at) < new Date()) return null

  if (row.email_verified_at) {
    await sql`UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ${row.token_id}`
  } else {
    await sql`UPDATE admin_users SET email_verified_at = NOW() WHERE id = ${row.user_id}`
    await sql`UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = ${row.user_id} AND used_at IS NULL`
  }

  if (!row.store_id || !row.slug) return null

  const settings = row.settings_json ?? {}
  return {
    userId: row.user_id,
    email: row.email,
    storeId: row.store_id,
    storeSlug: row.slug,
    storeName: row.store_name ?? row.slug,
    ownerName: settings.ownerName ?? row.email,
    termsVersion: row.terms_version ?? 'v1.0',
    termsAcceptedAt: row.terms_accepted_at ?? new Date().toISOString(),
    termsAcceptedIp: row.terms_accepted_ip ?? 'não disponível',
  }
}

/** Reenvia verificação se a conta existir e ainda não estiver verificada. */
export async function resendEmailVerification(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail)
  const rows = await sql`
    SELECT id, email_verified_at FROM admin_users WHERE email = ${email} LIMIT 1
  `
  const user = rows[0] as { id: string; email_verified_at: string | null } | undefined
  if (!user || user.email_verified_at) return

  await createAndSendEmailVerification(user.id, email)
}
