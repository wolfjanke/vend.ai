/** E-mail canônico para cadastro, login e recuperação de senha. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
