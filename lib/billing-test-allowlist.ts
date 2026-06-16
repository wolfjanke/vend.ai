/** E-mails autorizados a testar assinatura (upgrade) no sandbox Asaas. */

export function getBillingTestEmails(): string[] {
  const raw = process.env.BILLING_TEST_EMAILS?.trim()
  if (!raw) return []
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isBillingTestEmail(email?: string | null): boolean {
  if (!email) return false
  return getBillingTestEmails().includes(email.trim().toLowerCase())
}
