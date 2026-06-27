import { sql } from '@/lib/db'
import { normalizeEmail } from '@/lib/email-normalize'
import { getGlobalConfig } from '@/lib/global-config'

export type GoogleAdminUser = {
  id: string
  email: string
  storeId: string | null
}

/** Encontra, vincula ou cria usuário a partir do login Google. */
export async function resolveGoogleSignIn(params: {
  googleId: string
  email: string
  name?: string | null
}): Promise<GoogleAdminUser> {
  const email = normalizeEmail(params.email)
  const googleId = params.googleId.trim()
  if (!email || !googleId) {
    throw new Error('GOOGLE_PROFILE_INCOMPLETE')
  }

  const byGoogle = await sql`
    SELECT id, email, store_id
    FROM admin_users
    WHERE google_id = ${googleId}
    LIMIT 1
  `
  if (byGoogle[0]) {
    const row = byGoogle[0]
    await sql`
      UPDATE admin_users
      SET email_verified_at = COALESCE(email_verified_at, NOW())
      WHERE id = ${row.id as string}
    `
    return {
      id: row.id as string,
      email: row.email as string,
      storeId: (row.store_id as string | null) ?? null,
    }
  }

  const byEmail = await sql`
    SELECT id, email, store_id, google_id
    FROM admin_users
    WHERE email = ${email}
    LIMIT 1
  `
  if (byEmail[0]) {
    const row = byEmail[0]
    const existingGoogleId = row.google_id as string | null
    if (existingGoogleId && existingGoogleId !== googleId) {
      throw new Error('GOOGLE_EMAIL_CONFLICT')
    }
    await sql`
      UPDATE admin_users
      SET
        google_id = ${googleId},
        email_verified_at = COALESCE(email_verified_at, NOW())
      WHERE id = ${row.id as string}
    `
    return {
      id: row.id as string,
      email: row.email as string,
      storeId: (row.store_id as string | null) ?? null,
    }
  }

  const signupsEnabled = await getGlobalConfig<boolean>('new_signups_enabled')
  if (signupsEnabled === false) {
    throw new Error('SIGNUPS_DISABLED')
  }

  const [created] = await sql`
    INSERT INTO admin_users (email, google_id, email_verified_at)
    VALUES (${email}, ${googleId}, NOW())
    RETURNING id, email, store_id
  `

  return {
    id: created.id as string,
    email: created.email as string,
    storeId: (created.store_id as string | null) ?? null,
  }
}

export async function adminHasPassword(userId: string): Promise<boolean> {
  const rows = await sql`
    SELECT password_hash FROM admin_users WHERE id = ${userId} LIMIT 1
  `
  const hash = rows[0]?.password_hash as string | null | undefined
  return Boolean(hash)
}
