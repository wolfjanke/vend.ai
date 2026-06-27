import { sql } from '@/lib/db'
import { sendNewLoginAlertEmail } from '@/lib/email/send-new-login-alert'
import { logServerError } from '@/lib/logger'

function formatLoginTime(): string {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

/** Atualiza IP do último login e envia alerta se o IP mudou (fire-and-forget no e-mail). */
export async function recordAdminLogin(userId: string, email: string, ip: string): Promise<void> {
  if (!userId || !ip) return

  try {
    const rows = await sql`
      SELECT last_login_ip FROM admin_users WHERE id = ${userId} LIMIT 1
    `
    const previousIp = (rows[0]?.last_login_ip as string | null | undefined) ?? null

    await sql`
      UPDATE admin_users SET last_login_ip = ${ip} WHERE id = ${userId}
    `

    if (previousIp && previousIp !== ip) {
      void sendNewLoginAlertEmail(email, {
        ip,
        previousIp,
        at: formatLoginTime(),
      }).then(sent => {
        if (!sent.success) {
          logServerError('[login-alert] falha ao enviar', sent.error)
        }
      })
    }
  } catch (e) {
    logServerError('[login-alert] recordAdminLogin', e)
  }
}
