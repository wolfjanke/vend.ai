import Link from 'next/link'
import { COMPANY, companyCityShort } from '@/lib/company'

const sectionX = 'px-4 sm:px-6 md:px-12 lg:px-16'

export default function LandingFooter() {
  return (
    <footer className={`${sectionX} py-10 sm:py-12 border-t border-border`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 md:gap-0 justify-between items-start md:items-center mb-8">
          <div>
            <div className="font-syne font-extrabold text-2xl text-grad mb-1">vend.ai</div>
            <p className="text-sm text-muted">Feito com ✦ para lojistas que querem vender mais</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <Link href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</Link>
            <Link href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</Link>
            <Link href="#planos" className="hover:text-foreground transition-colors">Planos</Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </nav>
        </div>
        <div className="flex flex-col gap-3 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-muted space-y-1 break-words">
              <p>© 2026 {COMPANY.name}</p>
              <p>
                CNPJ {COMPANY.cnpj} · {companyCityShort()}
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted">
              <Link href="/termos" className="hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
              <span className="text-border px-1" aria-hidden>|</span>
              <Link href="/privacidade" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <span className="text-border px-1" aria-hidden>|</span>
              <a href="mailto:suporte@vend.ai" className="hover:text-foreground transition-colors">
                Contato
              </a>
            </nav>
          </div>
          <p className="text-xs text-muted">LGPD compliant · Dados protegidos</p>
        </div>
      </div>
    </footer>
  )
}
