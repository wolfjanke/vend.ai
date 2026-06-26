/** Mascara e-mail para logs (ex.: j***e@gmail.com). */
export function maskEmailForLog(email: string): string {
  const trimmed = email.trim().toLowerCase()
  const at = trimmed.indexOf('@')
  if (at <= 0) return '[email-invalido]'
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  if (!domain) return '[email-invalido]'
  const maskedLocal =
    local.length <= 2
      ? '*'.repeat(local.length)
      : `${local[0]}${'*'.repeat(Math.min(local.length - 2, 6))}${local[local.length - 1]}`
  return `${maskedLocal}@${domain}`
}
