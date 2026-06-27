import { headers } from 'next/headers'

/** Nonce CSP gerado no middleware (disponível em Server Components). */
export function getRequestNonce(): string | undefined {
  return headers().get('x-nonce') ?? undefined
}
