/**
 * Criptografia AES-256-GCM para PII (CPF/CNPJ de titular de cobrança).
 * Reutiliza SUBACCOUNT_ENCRYPTION_KEY — NUNCA logar plaintext ou ciphertext.
 */
import { encrypt, decrypt } from '@/lib/crypto/subaccount-key'
import { maskCnpj, maskCpf } from '@/lib/masks'

export type BillingOwnerType = 'pf' | 'pj'

export async function encryptTaxId(digits: string): Promise<string> {
  const d = digits.replace(/\D/g, '')
  if (d.length !== 11 && d.length !== 14) {
    throw new Error('Documento inválido para criptografia')
  }
  return encrypt(d)
}

export async function decryptTaxId(ciphertext: string): Promise<string> {
  return decrypt(ciphertext)
}

/** Compat: CPF de pedidos (11 dígitos). */
export async function encryptCpf(cpf: string): Promise<string> {
  return encryptTaxId(cpf)
}

export async function decryptCpf(ciphertext: string): Promise<string> {
  return decryptTaxId(ciphertext)
}

export function maskTaxIdForDisplay(type: BillingOwnerType, digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (type === 'pf' && d.length === 11) {
    const masked = maskCpf(d)
    return masked.replace(/^\d{3}\.\d{3}\.\d{3}-/, '•••.•••.•••-')
  }
  if (type === 'pj' && d.length === 14) {
    const masked = maskCnpj(d)
    return masked.replace(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-/, '••.•••.•••/••••-')
  }
  return '•••'
}
