import { sql } from '@/lib/db'
import { isSandboxMode } from '@/lib/payments/config'
import { getBillingTestEmails, isBillingTestEmail } from '@/lib/billing-test-allowlist'

export async function getStoreOwnerEmail(storeId: string): Promise<string | null> {
  const rows = await sql`
    SELECT COALESCE(s.owner_email, u.email) AS email
    FROM stores s
    LEFT JOIN admin_users u ON u.store_id = s.id
    WHERE s.id = ${storeId}
    LIMIT 1
  `
  const email = rows[0]?.email
  return typeof email === 'string' ? email.trim().toLowerCase() : null
}

/** Sandbox com allowlist: só e-mails listados podem criar/alterar assinatura. */
export async function assertBillingTestAllowed(storeId: string): Promise<void> {
  if (!isSandboxMode()) return

  const allowlist = getBillingTestEmails()
  if (allowlist.length === 0) return

  const email = await getStoreOwnerEmail(storeId)
  if (!isBillingTestEmail(email)) {
    throw new Error(
      'Este e-mail não está liberado para teste de assinatura no sandbox. Peça inclusão em BILLING_TEST_EMAILS.',
    )
  }
}

export async function isBillingTestAllowedForStore(storeId: string): Promise<boolean> {
  if (!isSandboxMode()) return true
  const allowlist = getBillingTestEmails()
  if (allowlist.length === 0) return true
  const email = await getStoreOwnerEmail(storeId)
  return isBillingTestEmail(email)
}
