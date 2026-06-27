/** Monta a política CSP. Em dev mantém unsafe-* para HMR/webpack. */
export function buildContentSecurityPolicy(nonce: string, dev: boolean): string {
  const asaasScripts = 'https://www.asaas.com https://sandbox.asaas.com'

  const scriptSrc = dev
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", asaasScripts]
    : ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", asaasScripts]

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co",
    "font-src 'self' data: https://fonts.gstatic.com",
    [
      "connect-src 'self'",
      'https://res.cloudinary.com',
      'https://api.cloudinary.com',
      'https://*.neon.tech',
      'https://generativelanguage.googleapis.com',
      'https://api.asaas.com',
      'https://sandbox.asaas.com',
      'https://brasilapi.com.br',
      'https://*.upstash.io',
    ].join(' '),
    `frame-src 'self' ${asaasScripts}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ]

  if (!dev) {
    directives.push('upgrade-insecure-requests')
  }

  return directives.join('; ')
}

export function generateCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}
