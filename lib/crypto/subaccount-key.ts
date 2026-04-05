/**
 * Criptografia AES-256-GCM para chaves de API das subcontas Asaas.
 * NUNCA logar o resultado de encrypt() ou decrypt().
 * Formato do ciphertext: base64(iv[12 bytes] || tag[16 bytes] || ciphertext)
 */

function getEncryptionKey(): Buffer {
  const keyB64 = process.env.SUBACCOUNT_ENCRYPTION_KEY
  if (!keyB64) {
    throw new Error('SUBACCOUNT_ENCRYPTION_KEY não configurada')
  }
  const key = Buffer.from(keyB64, 'base64')
  if (key.length !== 32) {
    throw new Error('SUBACCOUNT_ENCRYPTION_KEY deve ter exatamente 32 bytes (base64 de 32 bytes)')
  }
  return key
}

export async function encrypt(plaintext: string): Promise<string> {
  const keyBytes = getEncryptionKey()
  const iv       = crypto.getRandomValues(new Uint8Array(12))

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  )

  const encoded   = new TextEncoder().encode(plaintext)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded,
  )

  // AES-GCM retorna ciphertext + tag (últimos 16 bytes) concatenados
  const encryptedArray = new Uint8Array(encrypted)
  const combined       = new Uint8Array(12 + encryptedArray.length)
  combined.set(iv, 0)
  combined.set(encryptedArray, 12)

  return Buffer.from(combined).toString('base64')
}

export async function decrypt(ciphertext: string): Promise<string> {
  const keyBytes = getEncryptionKey()
  const combined = Buffer.from(ciphertext, 'base64')

  if (combined.length < 12 + 16) {
    throw new Error('Ciphertext inválido: muito curto')
  }

  const iv          = combined.subarray(0, 12)
  const encryptedWithTag = combined.subarray(12)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encryptedWithTag,
  )

  return new TextDecoder().decode(decrypted)
}
