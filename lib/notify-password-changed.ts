import { sendPasswordChangedEmail } from '@/lib/email/send-password-changed'
import { logServerError } from '@/lib/logger'

/** Notifica o usuário por e-mail (não bloqueia a resposta da API). */
export function notifyPasswordChanged(email: string): void {
  void sendPasswordChangedEmail(email).then(sent => {
    if (!sent.success) {
      logServerError('[notify-password-changed] falha ao enviar', sent.error)
    }
  })
}
