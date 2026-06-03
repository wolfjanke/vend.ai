/** Edge-safe: sem imports de next-auth (usado no middleware). */
const DEFAULT_SUPERADMIN = 'wolfgangjanke1@gmail.com'

export function getSuperadminEmails(): string[] {
  const raw = process.env.SUPERADMIN_EMAILS ?? DEFAULT_SUPERADMIN
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isSuperadminEmail(email?: string | null): boolean {
  if (!email) return false
  return getSuperadminEmails().includes(email.trim().toLowerCase())
}
