import Link from 'next/link'
import { COMPANY, PRODUCT } from '@/lib/company'

const sectionX = 'px-4 sm:px-6 md:px-12 lg:px-16'

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:text-foreground transition-colors">
      {children}
    </Link>
  )
}

function LinkDivider() {
  return <span className="text-border px-1" aria-hidden>|</span>
}

export default function WolfHubFooter() {
  return (
    <footer className={`${sectionX} py-8 sm:py-10 border-t border-border`}>
      <div className="max-w-5xl mx-auto flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
          <p className="text-sm sm:text-base text-foreground min-w-0 break-words">
            <span className="font-syne font-bold text-grad">{PRODUCT.name}</span>
            <span className="text-muted"> · by Wolf Hub</span>
          </p>
          <nav
            className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted shrink-0"
            aria-label="Links legais"
          >
            <FooterLink href="/termos">Termos de Uso</FooterLink>
            <LinkDivider />
            <FooterLink href="/privacidade">Privacidade</FooterLink>
            <LinkDivider />
            <FooterLink href="/contato">Contato</FooterLink>
          </nav>
        </div>
        <p className="text-[11px] sm:text-xs text-muted/70 break-words leading-relaxed">
          © 2026 {COMPANY.name} · CNPJ {COMPANY.cnpj}
        </p>
      </div>
    </footer>
  )
}
