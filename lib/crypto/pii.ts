/**
 * Criptografia AES-256-GCM para PII (CPF de clientes).
 * Reutiliza SUBACCOUNT_ENCRYPTION_KEY — NUNCA logar plaintext ou ciphertext.
 */
import { encrypt, decrypt } from '@/lib/crypto/subaccount-key'

export async function encryptCpf(cpf: string): Promise<string> {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) {
    throw new Error('CPF inválido para criptografia')
  }
  return encrypt(digits)
}

export async function decryptCpf(ciphertext: string): Promise<string> {
  return decrypt(ciphertext)
}
