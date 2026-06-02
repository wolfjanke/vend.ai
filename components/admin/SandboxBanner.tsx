import { isSandboxMode, getWolfHubApiKey } from '@/lib/payments/config'

export default function SandboxBanner() {
  if (!isSandboxMode()) return null

  const hasKey = !!getWolfHubApiKey()

  return (
    <div
      className="mb-4 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200 break-words"
      role="status"
    >
      <span className="font-semibold">Pagamentos em modo teste</span>
      {' — '}
      {hasKey
        ? 'ASAAS_ENV=sandbox. Cobranças não são reais.'
        : 'Configure WOLF_HUB_ASAAS_KEY e WOLF_HUB_WALLET_ID para ativar cobranças no sandbox.'}
    </div>
  )
}
