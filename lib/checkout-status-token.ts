import crypto from 'crypto'

const TTL_MS = 60 * 60 * 1000 // 1h

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET required for checkout status tokens')
  return s
}

/** Token opaco: base64url(paymentId:exp:hmac) */
export function signCheckoutStatusToken(paymentId: string): string {
  const exp = Date.now() + TTL_MS
  const payload = `${paymentId}:${exp}`
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function verifyCheckoutStatusToken(
  token: string,
  paymentId: string,
): boolean {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8')
    const parts = raw.split(':')
    if (parts.length !== 3) return false
    const [pid, expStr, sig] = parts
    if (pid !== paymentId) return false
    const exp = Number(expStr)
    if (!Number.isFinite(exp) || Date.now() > exp) return false
    const payload = `${pid}:${expStr}`
    const expected = crypto.createHmac('sha256', secret()).update(payload).digest('hex')
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
