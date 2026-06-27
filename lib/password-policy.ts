import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Senha deve ter ao menos 8 caracteres e incluir 2 dos seguintes: maiúscula, minúscula, número ou símbolo'

/** Quantidade de categorias atendidas (maiúscula, minúscula, dígito, símbolo). */
export function passwordComplexityScore(password: string): number {
  let score = 0
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

export function meetsPasswordComplexity(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && passwordComplexityScore(password) >= 2
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .refine(meetsPasswordComplexity, PASSWORD_COMPLEXITY_MESSAGE)
