/**
 * Kill switch global do checkout integrado.
 * Lançamento: desativado (default). Reativar com CHECKOUT_ENABLED=true no ambiente.
 */
export function isCheckoutLaunchEnabled(): boolean {
  const v = process.env.CHECKOUT_ENABLED?.trim().toLowerCase()
  return v === 'true' || v === '1'
}
