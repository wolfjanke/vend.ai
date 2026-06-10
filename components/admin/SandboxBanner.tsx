import { isSandboxMode, getVendaiAsaasKey } from '@/lib/payments/config'

export default function SandboxBanner() {
  if (!isSandboxMode()) return null

  const hasKey = !!getVendaiAsaasKey()

  return (
    <div
      className="mb-4 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200 break-words"
      role="status"
    >
      <span className="font-semibold">Pagamentos em modo teste</span>
      {' — '}
      {hasKey
        ? 'ASAAS_ENV=sandbox. Cobranças não são reais.'
        : 'Configure VENDAI_ASAAS_KEY e VENDAI_ASAAS_WALLET_ID para ativar cobranças no sandbox.'}
    </div>
  )
}
