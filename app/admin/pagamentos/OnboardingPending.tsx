'use client'

import type { AsaasOnboardingStatus } from '@/types'

interface Props {
  onboardingUrl: string | null
  status:        AsaasOnboardingStatus
}

export default function OnboardingPending({ onboardingUrl, status }: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
        <span className="font-syne font-bold">Cadastro em análise</span>
      </div>

      {status === 'AWAITING_APPROVAL' ? (
        <p className="text-sm text-muted mb-4 break-words">
          Seus dados foram enviados e estão sendo analisados. O processo pode levar até 2 dias úteis.
          Você receberá uma notificação quando aprovado.
        </p>
      ) : (
        <p className="text-sm text-muted mb-4 break-words">
          Sua conta foi criada. Para completar o cadastro e começar a receber, clique no botão abaixo para enviar sua documentação.
        </p>
      )}

      {onboardingUrl && (
        <a
          href={onboardingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full min-h-[44px] py-3 border border-primary text-primary font-syne font-semibold text-sm rounded-xl hover:bg-primary/10 transition-all"
        >
          Concluir cadastro →
        </a>
      )}

      <div className="mt-4 p-3 bg-surface2 rounded-xl text-xs text-muted space-y-1 break-words">
        <p>O que será solicitado durante o cadastro:</p>
        <ul className="list-disc list-inside space-y-0.5 mt-1">
          <li>Documento de identidade (RG/CNH)</li>
          <li>Comprovante de residência</li>
          <li>Dados bancários para recebimento</li>
        </ul>
      </div>
    </div>
  )
}
