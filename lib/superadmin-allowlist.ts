/** Edge-safe: sem imports de next-auth (usado no middleware). */

export function getSuperadminEmails(): string[] {
  const raw = process.env.SUPERADMIN_EMAILS?.trim()
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[superadmin] SUPERADMIN_EMAILS não definido em produção — painel superadmin inacessível.',
      )
    }
    return []
  }
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isSuperadminEmail(email?: string | null): boolean {
  if (!email) return false
  return getSuperadminEmails().includes(email.trim().toLowerCase())
}
