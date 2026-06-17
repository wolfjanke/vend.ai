import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import WolfHubFooter from '@/components/WolfHubFooter'
import { COMPANY } from '@/lib/company'
import { BRAND } from '@/lib/brand'

export const metadata = {
  title: `Contato — ${BRAND.displayName}`,
  description: `Fale com o time do ${BRAND.displayName}.`,
}

export default function ContatoPage() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <main className="flex-1 px-4 sm:px-6 md:px-16 py-12 max-w-3xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-10 min-h-[44px]"
        >
          <ArrowLeft size={14} />
          Voltar para o início
        </Link>

        <div className="mb-10">
          <h1 className="font-syne font-extrabold text-xl sm:text-2xl md:text-3xl text-foreground mb-3">
            Contato
          </h1>
          <p className="text-sm text-muted leading-relaxed break-words">
            Para suporte, dúvidas sobre sua conta ou solicitações relacionadas ao{' '}
            <strong className="text-foreground">{BRAND.displayName}</strong>, utilize os canais abaixo.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-sm text-muted leading-relaxed">
          <p>
            <strong className="text-foreground">Suporte:</strong>{' '}
            <a href={`mailto:${BRAND.supportEmail}`} className="text-primary hover:underline break-all">
              {BRAND.supportEmail}
            </a>
          </p>
          <p>
            <strong className="text-foreground">Privacidade e LGPD:</strong>{' '}
            <a href={`mailto:${BRAND.privacyEmail}`} className="text-primary hover:underline break-all">
              {BRAND.privacyEmail}
            </a>
          </p>
          <p className="break-words">
            <strong className="text-foreground">Empresa:</strong> {COMPANY.name} · CNPJ {COMPANY.cnpj}
          </p>
        </div>
      </main>
      <WolfHubFooter />
    </div>
  )
}
