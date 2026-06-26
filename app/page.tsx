import Link from 'next/link'
import {
  Store,
  Star,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Zap,
  Heart,
  ShoppingBag,
} from 'lucide-react'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingHeroDevices from '@/components/landing/LandingHeroDevices'
import LandingHeroMobile from '@/components/landing/LandingHeroMobile'
import ScrollReveal from '@/components/landing/ScrollReveal'
import LandingPlans from '@/components/landing/LandingPlans'
import LandingFooter from '@/components/landing/LandingFooter'
import LandingStickyCta from '@/components/landing/LandingStickyCta'
import LandingJsonLd from '@/components/landing/LandingJsonLd'
import { LandingEditorialCard, LandingPainLines } from '@/components/landing/LandingEditorialCard'
import { SITE_DESCRIPTION, SITE_TITLE, siteUrl } from '@/lib/site-seo'
import { LANDING_FAQ_ITEMS } from '@/lib/landing-faq'

export const metadata = {
  title:       SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates:  { canonical: siteUrl() },
}

/** Padding horizontal seguro no mobile (evita texto colado na borda / cortado) */
const sectionX = 'px-4 sm:px-6 md:px-12 lg:px-16'

const demoStoreHref =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/urban-mix`
    : '/urban-mix'

export default function LandingPage() {
  return (
    <main className="relative z-10 min-w-0 overflow-x-hidden">
      <LandingJsonLd />
      <div className="relative">
        <LandingHeader />
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section data-landing-hero className={`min-h-[calc(100vh-64px)] flex flex-col lg:flex-row lg:items-center lg:justify-between ${sectionX} gap-12 lg:gap-8 xl:gap-12 relative overflow-hidden pt-8 pb-16`}>
        {/* orbs */}
        <div className="animate-float-orb absolute w-[600px] h-[600px] -top-32 -left-32 bg-[radial-gradient(circle,_#7B6EFF12,_transparent_65%)] pointer-events-none" />
        <div className="animate-float-orb2 absolute w-[500px] h-[500px] bottom-0 right-32 bg-[radial-gradient(circle,_#00E5A00D,_transparent_65%)] pointer-events-none" />

        <div className="w-full min-w-0 flex-1 max-w-full lg:max-w-lg xl:max-w-xl animate-fade-up">
          {/* badge */}
          <div className="relative inline-flex flex-wrap items-center justify-center gap-2 px-3 py-2 sm:px-4 rounded-full border border-primary/40 bg-primary/10 text-primary text-[11px] sm:text-xs font-bold mb-6 sm:mb-7 ring-pulse max-w-full text-center">
            <Zap size={12} className="fill-primary shrink-0" />
            <span className="break-words text-balance">Vitrine + Vi — para quem vende moda no Instagram e WhatsApp</span>
          </div>

          <h1 className="font-syne font-extrabold text-[1.5rem] min-[360px]:text-[1.65rem] min-[400px]:text-[1.85rem] sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.15] sm:leading-[1.1] mb-5 break-words text-balance max-w-full">
            Sua vitrine de moda no ar —<br />
            com <span className="text-grad">atendente IA</span>
          </h1>

          <p className="text-muted text-base sm:text-lg leading-relaxed mb-8 max-w-md break-words">
            Catálogo no ar em minutos. A Vi (nossa assistente virtual com IA) atende seus clientes na vitrine, responde com seu estoque e manda o pedido formatado no WhatsApp — sem marketplace, sem complicação.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              href="/cadastro"
              className="shimmer font-syne font-bold px-7 py-4 rounded-xl bg-grad text-bg hover:opacity-90 hover:-translate-y-0.5 transition-all text-center min-h-[48px] flex items-center justify-center gap-2"
            >
              Criar minha loja grátis
              <ArrowRight size={16} />
            </Link>
            <div className="flex flex-col items-center sm:items-start gap-1 w-full sm:w-auto">
              <Link
                href={demoStoreHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium px-6 py-4 rounded-xl border border-border text-foreground hover:border-primary hover:text-primary transition-all text-center min-h-[48px] flex items-center justify-center w-full sm:w-auto"
                title="Ver loja de exemplo Urban Mix"
              >
                Ver demonstração ao vivo
              </Link>
              <p className="text-[11px] text-muted text-center sm:text-left break-words">
                Explore a Urban Mix — nossa loja de exemplo
              </p>
            </div>
          </div>

          <div className="text-sm text-muted space-y-2 max-w-md">
            <p className="break-words leading-relaxed">
              Feito para lojistas de moda no Brasil — do brechó à pequena marca.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-accent" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-accent" />
                Cancele quando quiser
              </span>
            </div>
          </div>
        </div>

        <LandingHeroMobile />
        <LandingHeroDevices />
      </section>

      {/* ── Benefícios ────────────────────────────────────────── */}
      <section className={`${sectionX} py-14 border-t border-border bg-surface/40`}>
        <ScrollReveal className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto min-w-0">
          {[
            '✓ Vi atendendo 24h',
            '✓ Vitrine no ar em minutos',
            '✓ Sem cartão de crédito',
            '✓ Cancele quando quiser',
          ].map(line => (
            <div
              key={line}
              className="text-sm sm:text-base text-foreground font-medium py-3 px-4 rounded-[2px] border border-[#252525] bg-[#161616] text-center break-words"
            >
              {line}
            </div>
          ))}
        </ScrollReveal>
      </section>

      {/* ── O Problema ────────────────────────────────────────── */}
      <section className={`${sectionX} py-16 sm:py-20 border-t border-border`}>
        <ScrollReveal className="min-w-0">
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">A realidade de quem vende moda</p>
          <h2 className="font-syne font-extrabold text-2xl min-[400px]:text-[1.65rem] sm:text-3xl md:text-4xl mb-4 max-w-full sm:max-w-xl leading-tight break-words text-balance">
            Você passa mais tempo respondendo Direct do que vendendo?
          </h2>
          <p className="text-muted text-base max-w-full sm:max-w-lg mb-10 sm:mb-12 break-words">
            Esse é o problema de quem começa. Com o vendai.club isso muda.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-5 min-w-0">
          {[
            {
              n: '01',
              before: '"Qual o tamanho disponível?" — você responde 30x por dia no direct.',
              after: 'A Vi responde por você, 24h, com os tamanhos e cores do seu estoque.',
              label: 'Atendimento',
            },
            {
              n: '02',
              before: 'Pedidos perdidos no direct, mensagens duplicadas, cliente sumiu.',
              after: 'Pedido formatado chega no seu WhatsApp. Sem ruído, sem perda.',
              label: 'Pedidos',
            },
            {
              n: '03',
              before: 'Cadastrar produto com foto, nome, tamanho, cor... leva horas.',
              after: 'Nos planos pagos, a IA gera nome, descrição e categoria a partir da foto. No grátis, cadastro manual.',
              label: 'Cadastro',
            },
          ].map((item, i) => (
            <ScrollReveal key={item.label} delay={i * 120}>
              <LandingEditorialCard
                number={item.n}
                title={item.label}
                className="h-full hover:border-primary/30 transition-colors"
              >
                <LandingPainLines negative={item.before} positive={item.after} />
              </LandingEditorialCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Vi em Ação (mock chat) ─────────────────────────────── */}
      <section className={`${sectionX} py-16 sm:py-20 border-t border-border`}>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-center min-w-0">
          <ScrollReveal direction="left" className="min-w-0">
            <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Vi — Assistente com IA</p>
            <h2 className="font-syne font-extrabold text-2xl sm:text-3xl md:text-4xl mb-5 leading-tight break-words text-balance">
              Sua vendedora virtual que nunca dorme
            </h2>
            <p className="text-muted text-base leading-relaxed mb-6 break-words">
              A Vi conhece todo o seu catálogo, sugere produtos por estilo, cor e tamanho, e guia o cliente até o pedido no WhatsApp — tudo automaticamente.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                'Atende clientes 24h, mesmo quando você está dormindo',
                'Sugere produtos por estilo, cor e tamanho disponível',
                'Responde dúvidas sobre a loja e formas de pagamento',
                'Monta o resumo do pedido e envia pro seu WhatsApp',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </ScrollReveal>

          {/* chat mock */}
          <ScrollReveal direction="right">
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_20px_60px_#00000055]">
              {/* chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface2">
                <div className="w-8 h-8 rounded-full bg-grad flex items-center justify-center text-bg font-bold text-xs font-syne">Vi</div>
                <div>
                  <p className="font-syne font-bold text-sm">Vi — Loja da Ana</p>
                  <p className="text-[10px] text-accent flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse" />
                    Online agora
                  </p>
                </div>
              </div>
              {/* messages */}
              <div className="p-4 flex flex-col gap-3 min-h-[280px]">
                <div className="chat-bubble-in" style={{ animationDelay: '0.1s' }}>
                  <div className="max-w-[80%] bg-surface2 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-foreground">
                    Oi! Tem algum vestido floral tamanho M?
                  </div>
                  <p className="text-[10px] text-muted mt-1 ml-1">Cliente • agora</p>
                </div>
                <div className="chat-bubble-in flex flex-col items-end" style={{ animationDelay: '0.6s' }}>
                  <div className="max-w-[85%] bg-primary/20 border border-primary/30 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-foreground">
                    Olá! 🌸 Temos sim! Encontrei <strong>3 opções florais no tamanho M</strong>:
                    <br /><br />
                    🌼 Vestido Floral Amarelo — R$ 89,90 (M e G)<br />
                    🌸 Vestido Rosa Chá Floral — R$ 97,90 (M)<br />
                    🌺 Vestido Midi Floral — R$ 115,00 (P, M, G)
                    <br /><br />
                    Quer ver fotos de algum? 😊
                  </div>
                  <p className="text-[10px] text-muted mt-1 mr-1">Vi • agora</p>
                </div>
                <div className="chat-bubble-in" style={{ animationDelay: '1.1s' }}>
                  <div className="max-w-[75%] bg-surface2 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-foreground">
                    Quero o Rosa Chá! Como faço o pedido?
                  </div>
                </div>
                <div className="chat-bubble-in flex flex-col items-end" style={{ animationDelay: '1.5s' }}>
                  <div className="max-w-[85%] bg-primary/20 border border-primary/30 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-foreground">
                    Perfeito! Clique em &quot;Fazer pedido&quot; e eu envio o resumo direto pro WhatsApp da loja 🛍️
                  </div>
                  <p className="text-[10px] text-muted mt-1 mr-1">Vi • agora</p>
                </div>
                {/* typing */}
                <div className="flex items-center gap-1 px-3 py-2 bg-surface2 rounded-2xl rounded-tl-sm self-start w-fit">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted animate-typing-dot"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Como funciona ─────────────────────────────────────── */}
      <section id="como-funciona" className={`${sectionX} py-16 sm:py-20 border-t border-border scroll-mt-24`}>
        <ScrollReveal>
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Como funciona</p>
          <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-14 leading-tight">
            Do cadastro à venda<br />em 3 passos
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5 relative">
          {/* connecting line desktop */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px border-t border-dashed border-primary/30" />

          {[
            {
              n: '01',
              title: 'Crie sua loja',
              desc: 'Foto, nome, WhatsApp — e seu link está no ar. Sem precisar de programador ou designer.',
            },
            {
              n: '02',
              title: 'Adicione produtos com IA',
              desc: 'Nos planos pagos, tire uma foto da peça e a IA cria nome, descrição e categoria. No grátis, cadastre manualmente.',
            },
            {
              n: '03',
              title: 'Receba pedidos no WhatsApp',
              desc: 'Cliente navega, monta o carrinho com a Vi, e o pedido formatado chega no seu WhatsApp.',
            },
          ].map((step, i) => (
            <ScrollReveal key={step.n} delay={i * 130}>
              <LandingEditorialCard
                number={step.n}
                title={step.title}
                showDivider={false}
                className="h-full hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_var(--primary-glow)] transition-all sm:px-7 sm:py-7"
              >
                <p className="text-sm font-light text-[#666666] leading-relaxed break-words">{step.desc}</p>
              </LandingEditorialCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="funcionalidades" className={`${sectionX} py-16 sm:py-20 border-t border-border scroll-mt-24`}>
        <ScrollReveal>
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Funcionalidades</p>
          <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-14 leading-tight">
            Tudo que você precisa.<br />Nada que você não usa.
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              n: '01',
              title: 'Vi — Assistente com IA',
              desc: 'A Vi atende seus clientes 24h: sugere produtos, responde dúvidas e encaminha pedidos pro WhatsApp.',
              highlight: true,
            },
            {
              n: '02',
              title: 'Pedidos direto no WhatsApp',
              desc: 'Quando o cliente finaliza, o pedido vai formatado pro seu WhatsApp. Você não precisa de nenhum app novo.',
            },
            {
              n: '03',
              title: 'Painel de controle',
              desc: 'Gerencie pedidos, estoque e métricas em um lugar só. Simples e rápido.',
            },
            {
              n: '04',
              title: 'IA no cadastro',
              desc: 'Planos pagos: foto do produto vira nome e descrição com IA (20 análises/mês no Starter; ilimitado no Pro+). Grátis: cadastro manual.',
            },
            {
              n: '05',
              title: 'Controle de estoque',
              desc: 'Por tamanho, cor ou volume — controle por SKU e aviso de estoque baixo no painel.',
            },
            {
              n: '06',
              title: 'Recuperação de pedido',
              desc: 'No plano Pro ou superior, veja pedidos não finalizados há 24h e envie mensagem pronta pelo painel.',
            },
            {
              n: '07',
              title: 'Desconto no PIX',
              desc: 'Configure percentual automático quando o cliente escolhe PIX no carrinho ou no WhatsApp.',
            },
            {
              n: '08',
              title: 'Cupons e PDV',
              desc: 'Cupons de desconto no Pro. Mini PDV para loja física no plano Loja.',
            },
          ].map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 80}>
              <LandingEditorialCard
                number={f.n}
                title={f.title}
                className={`h-full hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_var(--primary-glow)] transition-all ${
                  f.highlight ? 'ring-1 ring-primary/30' : ''
                }`}
              >
                <p className="text-xs text-[#666666] font-light leading-relaxed break-words">{f.desc}</p>
              </LandingEditorialCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Para quem é ───────────────────────────────────────── */}
      <section className={`${sectionX} py-16 sm:py-20 border-t border-border`}>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-center min-w-0">
          <ScrollReveal direction="left">
            <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Para quem é</p>
            <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-5 leading-tight">
              Feito para quem<br />vende moda
            </h2>
            <p className="text-muted text-base leading-relaxed mb-8">
              Não importa se você está começando do zero ou já vende no Instagram. O vendai.club é feito pra você ter uma presença digital de verdade — sem complicação.
            </p>
            <div className="flex flex-wrap gap-2.5 mb-8">
              {[
                { label: 'Revendedoras', icon: Heart },
                { label: 'Brechós', icon: ShoppingBag },
                { label: 'Pequenas marcas', icon: Star },
                { label: 'Lojas de roupas', icon: Store },
                { label: 'Quem vende no Instagram', icon: Zap },
              ].map(({ label, icon: Icon }) => (
                <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface2 border border-border rounded-full text-sm text-foreground hover:border-primary/40 transition-colors">
                  <Icon size={12} className="text-primary" />
                  {label}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="bg-primary/8 border border-primary/25 rounded-[2px] p-7 mb-5">
              <p className="font-syne font-bold text-sm mb-3 text-primary">Por que não só link no bio?</p>
              <p className="text-sm text-muted leading-relaxed">
                Porque no vendai.club você tem catálogo inteligente, IA que sugere produtos ao cliente e pedido formatado direto no seu WhatsApp — sem planilha, sem confusão, sem perder venda.
              </p>
            </div>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
              {[
                { label: 'Link na bio', items: ['Só mostra uma foto', 'Cliente precisa te chamar', 'Você responde manualmente', 'Sem controle de estoque'] },
                { label: 'vendai.club', items: ['Catálogo completo', 'Vi atende 24h', 'Pedido no WhatsApp', 'Estoque atualizado'] },
              ].map(col => (
                <div key={col.label} className={`rounded-[2px] p-4 border ${col.label === 'vendai.club' ? 'border-primary/40 bg-primary/8' : 'border-[#252525] bg-[#161616]'}`}>
                  <p className={`font-syne font-bold text-xs mb-3 ${col.label === 'vendai.club' ? 'text-primary' : 'text-muted'}`}>{col.label}</p>
                  <ul className="flex flex-col gap-2">
                    {col.items.map(item => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-muted">
                        {col.label === 'vendai.club'
                          ? <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-accent" />
                          : <XCircle size={11} className="mt-0.5 shrink-0" style={{ color: 'var(--warm)' }} />
                        }
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Depoimentos ───────────────────────────────────────── */}
      <section className={`${sectionX} py-16 sm:py-20 border-t border-border`}>
        <ScrollReveal>
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Depoimentos</p>
          <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-4 leading-tight break-words">
            Junte-se a quem já vende mais
          </h2>
          <p className="text-muted text-sm sm:text-base mb-2 max-w-xl break-words">
            Lojistas de todo o Brasil usando o vendai.club para vender mais com menos esforço.
          </p>
          <p className="text-[11px] text-muted/80 mb-12 max-w-xl break-words">
            Exemplos ilustrativos do dia a dia de quem vende moda online.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-5 min-w-0">
          {[
            {
              quote: 'Montei minha loja em um dia. A Vi atende meus clientes e os pedidos chegam certinhos no WhatsApp. Não precisei de nada técnico.',
              name: 'Maria',
              store: 'Brechó da Maria',
              highlight: 'pedidos chegam certinhos no WhatsApp',
            },
            {
              quote: 'A IA no cadastro salvou horas da minha semana. Foto da peça e já tenho nome e descrição. Antes eu ficava fazendo isso no celular até meia-noite.',
              name: 'Ana',
              store: 'Moda & Você',
              highlight: 'A IA no cadastro salvou horas',
            },
            {
              quote: 'Comecei com o plano grátis pra testar. Em uma semana já estava no Starter. A Vi vendeu mais do que eu esperava.',
              name: 'Cris',
              store: 'Estilo Cris',
              highlight: 'A Vi vendeu mais do que eu esperava',
            },
          ].map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <div className="bg-[#161616] border border-[#252525] rounded-[2px] p-5 sm:p-6 h-full flex flex-col gap-4 hover:border-primary/30 transition-all min-w-0">
                <div className="flex">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} className="fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted leading-relaxed flex-1 min-w-0 break-words">
                  &ldquo;
                  {t.quote.split(t.highlight).map((part, idx, arr) => (
                    idx < arr.length - 1
                      ? <span key={idx}>{part}<strong className="text-foreground">{t.highlight}</strong></span>
                      : <span key={idx}>{part}</span>
                  ))}
                  &rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <span
                    className="w-10 h-10 rounded-full bg-primary/15 text-primary font-syne font-bold text-sm flex items-center justify-center shrink-0"
                    aria-hidden
                  >
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-syne font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-muted">{t.store}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Formas de pagamento ─────────────────────────────────── */}
      <section className={`${sectionX} py-16 sm:py-20 border-t border-border scroll-mt-24 bg-[#0F0F0F]`}>
        <ScrollReveal className="min-w-0 max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Pagamento</p>
          <h2 className="font-syne font-extrabold text-2xl sm:text-3xl md:text-4xl mb-3 leading-tight break-words">
            Você escolhe como receber
          </h2>
          <p className="text-muted text-sm sm:text-base mb-6 break-words">
            O vendai.club não processa pagamentos dos seus clientes. Você recebe direto, do jeito que já usa hoje.
          </p>
          <ul className="flex flex-col gap-2.5 text-sm text-muted mb-8">
            {[
              'Finalize pedidos pelo WhatsApp — padrão para todas as lojas',
              'Cadastre sua chave PIX no painel (todos os planos)',
              'Nos planos pagos: links do Mercado Pago, PagBank ou InfinityPay na vitrine',
              'Combine pagamento no chat, como você já faz',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" />
                <span className="break-words">{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="#planos"
            className="inline-flex min-h-[44px] items-center px-5 py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:opacity-90"
          >
            Ver planos →
          </Link>
        </ScrollReveal>
      </section>

      {/* ── Planos ────────────────────────────────────────────── */}
      <section id="planos" className={`${sectionX} py-16 sm:py-20 border-t border-border scroll-mt-24`}>
        <ScrollReveal className="min-w-0">
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Planos</p>
          <h2 className="font-syne font-extrabold text-xl sm:text-3xl md:text-4xl leading-tight mb-4 max-w-full sm:max-w-2xl break-words">
            Comece grátis.<br />Cresça quando quiser.
          </h2>
          <p className="text-muted text-sm mb-10 sm:mb-14 break-words">
            Sem fidelidade. Cancele quando quiser. Preços mensais — no painel, opção trimestral (-10%) e anual (-20%).
          </p>
        </ScrollReveal>

        <LandingPlans />
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className={`${sectionX} py-16 sm:py-20 border-t border-border scroll-mt-24`}>
        <div className="max-w-2xl mx-auto min-w-0">
          <ScrollReveal>
            <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">FAQ</p>
            <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-10 leading-tight">
              Perguntas frequentes
            </h2>
          </ScrollReveal>

          <div className="space-y-2">
            {LANDING_FAQ_ITEMS.map((item, i) => (
              <ScrollReveal key={i} delay={i * 50}>
                <details className="bg-[#161616] border border-[#252525] rounded-[2px] overflow-hidden group">
                  <summary className="px-4 sm:px-5 py-4 cursor-pointer list-none font-syne font-bold text-sm flex items-center justify-between gap-3 hover:text-primary transition-colors min-w-0">
                    <span className="min-w-0 flex-1 pe-2 break-words">{item.q}</span>
                    <span className="text-muted group-open:rotate-180 transition-transform shrink-0 text-xs">▼</span>
                  </summary>
                  <p className="px-5 pb-4 text-sm text-muted leading-relaxed">{item.a}</p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────────── */}
      <section data-landing-final-cta className={`${sectionX} py-20 sm:py-24 border-t border-border relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#7B6EFF18_0%,_transparent_65%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,_#00E5A010_0%,_transparent_50%)] pointer-events-none" />

        <ScrollReveal className="relative text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/40 bg-accent/10 text-accent text-xs font-bold mb-8">
            <Zap size={12} className="fill-accent" />
            Grátis para começar
          </div>
          <h2 className="font-syne font-extrabold text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl mb-5 leading-tight break-words">
            Sua vitrine de<br />
            moda com IA<br />
            no WhatsApp.<br />
            <span className="text-grad">
              Grátis para<br />
              começar.
            </span>
          </h2>
          <p className="text-muted text-base sm:text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Sem cartão de crédito, sem fidelidade, sem complicação. Comece agora e veja como é fácil vender mais.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/cadastro"
              className="shimmer font-syne font-bold px-8 py-4 rounded-xl bg-grad text-bg hover:opacity-90 hover:-translate-y-0.5 transition-all text-center min-h-[52px] flex items-center justify-center gap-2 text-base"
            >
              Criar minha loja grátis
              <ArrowRight size={18} />
            </Link>
            <Link
              href={demoStoreHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium px-7 py-4 rounded-xl border border-border text-foreground hover:border-primary hover:text-primary transition-all text-center min-h-[52px] flex items-center justify-center"
            >
              Ver demonstração
            </Link>
          </div>
          <p className="text-xs text-muted mt-6">
            Sem cartão de crédito · Cancela quando quiser · Conforme a LGPD
          </p>
        </ScrollReveal>
      </section>

      <LandingFooter />
      <LandingStickyCta />
    </main>
  )
}
