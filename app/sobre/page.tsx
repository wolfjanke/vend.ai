import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import WolfHubFooter from '@/components/WolfHubFooter'
import { COMPANY, PRODUCT } from '@/lib/company'
import { BRAND } from '@/lib/brand'
import { SITE_DESCRIPTION, SITE_ENTITY, siteUrl } from '@/lib/site-seo'

export const metadata: Metadata = {
  title:       `Sobre o ${BRAND.displayName}`,
  description: SITE_DESCRIPTION,
  alternates:  { canonical: siteUrl('/sobre') },
  openGraph: {
    title:       `Sobre o ${BRAND.displayName}`,
    description: SITE_DESCRIPTION,
    url:         siteUrl('/sobre'),
    type:        'website',
  },
}

const sectionX = 'px-4 sm:px-6 md:px-12 lg:px-16'

export default function SobrePage() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col min-w-0 overflow-x-hidden">
      <main className={`flex-1 ${sectionX} py-12 max-w-3xl mx-auto w-full`}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-10 min-h-[44px]"
        >
          <ArrowLeft size={14} aria-hidden />
          Voltar para o início
        </Link>

        <article className="prose-invert space-y-8 text-sm text-muted leading-relaxed break-words">
          <header>
            <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-2">Sobre</p>
            <h1 className="font-syne font-extrabold text-xl sm:text-2xl md:text-3xl text-foreground mb-4">
              {PRODUCT.displayName} — vitrine online com IA para moda
            </h1>
            <p className="text-base">{SITE_DESCRIPTION}</p>
          </header>

          <section>
            <h2 className="font-syne font-bold text-lg text-foreground mb-3">Identidade oficial</h2>
            <ul className="space-y-2 list-none p-0 m-0">
              <li><strong className="text-foreground">Produto:</strong> {PRODUCT.displayName}</li>
              <li><strong className="text-foreground">Site:</strong>{' '}
                <a href={SITE_ENTITY.canonicalUrl} className="text-primary hover:underline break-all">
                  {SITE_ENTITY.domain}
                </a>
              </li>
              <li><strong className="text-foreground">Empresa:</strong> {COMPANY.name}</li>
              <li><strong className="text-foreground">CNPJ:</strong> {COMPANY.cnpj}</li>
              <li><strong className="text-foreground">País:</strong> Brasil</li>
            </ul>
            <p className="mt-4 p-4 rounded-xl border border-border bg-surface2/50 text-xs break-words">
              {SITE_ENTITY.notToConfuse}
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-foreground mb-3">O que é (e o que não é)</h2>
            <p>
              O {PRODUCT.displayName} é uma <strong className="text-foreground">vitrine online com assistente de IA</strong> para
              quem vende moda no Instagram e WhatsApp. Combina catálogo, a Vi (assistente que sugere produtos por estilo,
              cor e tamanho) e pedidos formatados no WhatsApp do lojista.
            </p>
            <p className="mt-3">
              <strong className="text-foreground">Não é</strong> um marketplace, nem um e-commerce tradicional com checkout
              obrigatório. O lojista recebe pagamento como já faz (PIX, links ou acordo no WhatsApp).
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-foreground mb-3">Principais funcionalidades</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Vitrine com link próprio (ex.: {SITE_ENTITY.domain}/sua-loja)</li>
              <li>Vi — assistente com IA 24h na loja</li>
              <li>Pedidos organizados no WhatsApp</li>
              <li>Estoque por tamanho, cor ou volume (SKU)</li>
              <li>Alertas de estoque baixo no painel</li>
              <li>IA no cadastro de produtos (planos pagos)</li>
              <li>Cupons, recuperação de pedidos e PDV (planos superiores)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-foreground mb-3">Para quem é</h2>
            <p>{SITE_ENTITY.audience}.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-foreground mb-3">Demonstração</h2>
            <p>
              Loja de exemplo ao vivo:{' '}
              <Link href={SITE_ENTITY.demoStorePath} className="text-primary hover:underline">
                Urban Mix
              </Link>
              .
            </p>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-grad text-bg font-syne font-bold text-sm hover:opacity-90"
            >
              Criar loja grátis
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/#planos"
              className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:border-primary hover:text-primary transition-colors"
            >
              Ver planos
            </Link>
          </div>
        </article>
      </main>
      <WolfHubFooter />
    </div>
  )
}
