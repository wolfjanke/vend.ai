import Link from 'next/link'
import {
  Store,
  Camera,
  MessageCircle,
  Bot,
  BarChart3,
  Package,
  Star,
  Clock,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp,
  Heart,
} from 'lucide-react'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingPhoneMockup from '@/components/landing/LandingPhoneMockup'
import ScrollReveal from '@/components/landing/ScrollReveal'
import NumberCounter from '@/components/landing/NumberCounter'

export default function LandingPage() {
  return (
    <main className="relative z-10">
      <div className="relative">
        <LandingHeader />
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="min-h-[calc(100vh-64px)] flex items-center px-6 md:px-16 gap-16 relative overflow-hidden pt-8 pb-16">
        {/* orbs */}
        <div className="animate-float-orb absolute w-[600px] h-[600px] -top-32 -left-32 bg-[radial-gradient(circle,_#7B6EFF12,_transparent_65%)] pointer-events-none" />
        <div className="animate-float-orb2 absolute w-[500px] h-[500px] bottom-0 right-32 bg-[radial-gradient(circle,_#00E5A00D,_transparent_65%)] pointer-events-none" />

        <div className="flex-1 max-w-xl animate-fade-up">
          {/* badge */}
          <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-bold mb-7 ring-pulse">
            <Zap size={12} className="fill-primary" />
            Plataforma com IA para quem vende moda
          </div>

          <h1 className="font-syne font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] mb-5">
            Sua loja de roupas<br />
            no digital{' '}
            <span className="text-grad">em 2 minutos.</span>
          </h1>

          <p className="text-muted text-base sm:text-lg leading-relaxed mb-8 max-w-md">
            Catálogo inteligente, assistente com IA e pedidos direto no WhatsApp.
            Perfeito pra quem está começando — sem precisar de site ou taxa de marketplace.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              href="/cadastro"
              className="shimmer font-syne font-bold px-7 py-4 rounded-xl bg-grad text-bg hover:opacity-90 hover:-translate-y-0.5 transition-all text-center min-h-[48px] flex items-center justify-center gap-2"
            >
              Criar minha loja grátis
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/bella-moda"
              className="font-medium px-6 py-4 rounded-xl border border-border text-foreground hover:border-primary hover:text-primary transition-all text-center min-h-[48px] flex items-center justify-center"
              title="Ver loja de exemplo com a Vi em ação"
            >
              Ver demonstração ao vivo
            </Link>
          </div>

          {/* social proof inline */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {['🧕', '👩', '👩‍🦱', '👩‍🦳'].map((e, i) => (
                  <span key={i} className="text-lg leading-none">{e}</span>
                ))}
              </div>
              <span><strong className="text-foreground">+1.200</strong> lojistas</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className="fill-accent text-accent" />
              ))}
              <span className="ml-1">4,9/5</span>
            </div>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-accent" />
              Sem cartão de crédito
            </span>
          </div>
        </div>

        <LandingPhoneMockup />
      </section>

      {/* ── Numbers ───────────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-14 border-t border-border bg-surface/40">
        <ScrollReveal className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-4xl mx-auto">
          <div>
            <div className="font-syne font-extrabold text-3xl sm:text-4xl text-grad mb-1">
              <NumberCounter target={1200} suffix="+" />
            </div>
            <p className="text-xs text-muted leading-snug">Lojistas ativos</p>
          </div>
          <div>
            <div className="font-syne font-extrabold text-3xl sm:text-4xl text-grad mb-1">
              <NumberCounter target={2} suffix=" min" />
            </div>
            <p className="text-xs text-muted leading-snug">Para montar a loja</p>
          </div>
          <div>
            <div className="font-syne font-extrabold text-3xl sm:text-4xl text-grad mb-1">
              <NumberCounter target={95} suffix="%" />
            </div>
            <p className="text-xs text-muted leading-snug">Pedidos via WhatsApp</p>
          </div>
          <div>
            <div className="font-syne font-extrabold text-3xl sm:text-4xl text-grad mb-1">
              <NumberCounter target={24} suffix="h" />
            </div>
            <p className="text-xs text-muted leading-snug">Vi atendendo pra você</p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── O Problema ────────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-20 border-t border-border">
        <ScrollReveal>
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">A realidade de quem vende moda</p>
          <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-4 max-w-xl leading-tight">
            Você passa mais tempo respondendo Direct do que vendendo?
          </h2>
          <p className="text-muted text-base max-w-lg mb-12">
            Esse é o problema de quem começa. Com o vend.ai isso muda.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Clock,
              color: 'warm',
              before: '"Qual o tamanho disponível?" — você responde 30x por dia no direct.',
              after: 'A Vi responde por você, 24h, com os tamanhos e cores do seu estoque.',
              label: 'Atendimento',
            },
            {
              icon: ShoppingBag,
              color: 'warm',
              before: 'Pedidos perdidos no direct, mensagens duplicadas, cliente sumiu.',
              after: 'Pedido formatado chega no seu WhatsApp. Sem ruído, sem perda.',
              label: 'Pedidos',
            },
            {
              icon: Camera,
              color: 'warm',
              before: 'Cadastrar produto com foto, nome, tamanho, cor... leva horas.',
              after: 'Tira uma foto. A IA gera nome, descrição e categoria na hora.',
              label: 'Cadastro',
            },
          ].map((item, i) => (
            <ScrollReveal key={item.label} delay={i * 120}>
              <div className="bg-surface border border-border rounded-2xl p-6 h-full flex flex-col gap-4 hover:border-primary/40 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-warm/10 flex items-center justify-center">
                    <item.icon size={16} className="text-warm-DEFAULT" style={{ color: 'var(--warm)' }} />
                  </div>
                  <span className="font-syne font-bold text-sm">{item.label}</span>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex gap-2.5 items-start">
                    <XCircle size={15} className="mt-0.5 shrink-0 text-warm-DEFAULT" style={{ color: 'var(--warm)' }} />
                    <p className="text-sm text-muted leading-relaxed">{item.before}</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" />
                    <p className="text-sm text-foreground leading-relaxed">{item.after}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Vi em Ação (mock chat) ─────────────────────────────── */}
      <section className="px-6 md:px-16 py-20 border-t border-border">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal direction="left">
            <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Vi — Assistente com IA</p>
            <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-5 leading-tight">
              Sua vendedora virtual que nunca dorme
            </h2>
            <p className="text-muted text-base leading-relaxed mb-6">
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
      <section id="como-funciona" className="px-6 md:px-16 py-20 border-t border-border scroll-mt-24">
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
              icon: Store,
              title: 'Crie sua loja',
              desc: 'Foto, nome, WhatsApp — e seu link está no ar. Sem precisar de programador ou designer.',
            },
            {
              n: '02',
              icon: Camera,
              title: 'Adicione produtos com IA',
              desc: 'Tire uma foto da peça. A IA cria nome, descrição e categoria automaticamente. Em segundos.',
            },
            {
              n: '03',
              icon: MessageCircle,
              title: 'Receba pedidos no WhatsApp',
              desc: 'Cliente navega, monta o carrinho com a Vi, e o pedido formatado chega no seu WhatsApp.',
            },
          ].map((step, i) => (
            <ScrollReveal key={step.n} delay={i * 130}>
              <div className="relative bg-surface border border-border rounded-2xl p-7 hover:border-primary hover:-translate-y-1 hover:shadow-[0_10px_40px_var(--primary-glow)] transition-all h-full">
                <span className="absolute top-4 right-5 font-syne font-extrabold text-5xl text-primary/10 leading-none select-none">
                  {step.n}
                </span>
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                  <step.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-syne font-bold text-base mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="funcionalidades" className="px-6 md:px-16 py-20 border-t border-border scroll-mt-24">
        <ScrollReveal>
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Funcionalidades</p>
          <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-14 leading-tight">
            Tudo que você precisa.<br />Nada que você não usa.
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Bot,
              title: 'Vi — Assistente com IA',
              desc: 'A Vi atende seus clientes 24h: sugere produtos, responde dúvidas e encaminha pedidos pro WhatsApp.',
              highlight: true,
            },
            {
              icon: MessageCircle,
              title: 'Pedidos direto no WhatsApp',
              desc: 'Quando o cliente finaliza, o pedido vai formatado pro seu WhatsApp. Você não precisa de nenhum app novo.',
            },
            {
              icon: BarChart3,
              title: 'Painel de controle',
              desc: 'Gerencie pedidos, estoque e métricas em um lugar só. Simples e rápido.',
            },
            {
              icon: Camera,
              title: 'IA no cadastro',
              desc: 'Tire foto do produto e a IA gera nome e descrição na hora. Cadastre 10x mais rápido.',
            },
            {
              icon: Package,
              title: 'Controle de estoque',
              desc: 'Por tamanho e cor, com alertas automáticos de estoque baixo.',
            },
            {
              icon: TrendingUp,
              title: 'Recuperação de pedido',
              desc: 'Nos planos Pro+, veja quem não finalizou e envie mensagem pronta pelo painel.',
            },
          ].map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 80}>
              <div
                className={`group bg-surface border rounded-[18px] p-6 hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_var(--primary-glow)] transition-all h-full flex flex-col gap-3 ${
                  f.highlight ? 'border-primary/40 bg-primary/5' : 'border-border'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.highlight ? 'bg-primary/20' : 'bg-surface2'}`}>
                  <f.icon size={18} className={f.highlight ? 'text-primary' : 'text-muted'} />
                </div>
                <h3 className="font-syne font-bold text-sm">{f.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Para quem é ───────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-20 border-t border-border">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal direction="left">
            <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Para quem é</p>
            <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-5 leading-tight">
              Feito para quem<br />vende moda
            </h2>
            <p className="text-muted text-base leading-relaxed mb-8">
              Não importa se você está começando do zero ou já vende no Instagram. O vend.ai é feito pra você ter uma presença digital de verdade — sem complicação.
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
            <div className="bg-primary/8 border border-primary/25 rounded-2xl p-7 mb-5">
              <p className="font-syne font-bold text-sm mb-3 text-primary">Por que não só link no bio?</p>
              <p className="text-sm text-muted leading-relaxed">
                Porque no vend.ai você tem catálogo inteligente, IA que sugere produtos ao cliente e pedido formatado direto no seu WhatsApp — sem planilha, sem confusão, sem perder venda.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Link na bio', items: ['Só mostra uma foto', 'Cliente precisa te chamar', 'Você responde manualmente', 'Sem controle de estoque'] },
                { label: 'vend.ai', items: ['Catálogo completo', 'Vi atende 24h', 'Pedido no WhatsApp', 'Estoque atualizado'] },
              ].map(col => (
                <div key={col.label} className={`rounded-xl p-4 border ${col.label === 'vend.ai' ? 'border-primary/40 bg-primary/8' : 'border-border bg-surface'}`}>
                  <p className={`font-syne font-bold text-xs mb-3 ${col.label === 'vend.ai' ? 'text-primary' : 'text-muted'}`}>{col.label}</p>
                  <ul className="flex flex-col gap-2">
                    {col.items.map(item => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-muted">
                        {col.label === 'vend.ai'
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
      <section className="px-6 md:px-16 py-20 border-t border-border">
        <ScrollReveal>
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Depoimentos</p>
          <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-12 leading-tight">
            +1.200 lojistas já vendem<br />com o vend.ai
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              quote: 'Montei minha loja em um dia. A Vi atende meus clientes e os pedidos chegam certinhos no WhatsApp. Não precisei de nada técnico.',
              name: 'Maria',
              store: 'Brechó da Maria',
              emoji: '🧕',
              highlight: 'pedidos chegam certinhos no WhatsApp',
            },
            {
              quote: 'A IA no cadastro salvou horas da minha semana. Foto da peça e já tenho nome e descrição. Antes eu ficava fazendo isso no celular até meia-noite.',
              name: 'Ana',
              store: 'Moda & Você',
              emoji: '👩‍🦱',
              highlight: 'A IA no cadastro salvou horas',
            },
            {
              quote: 'Comecei com o plano grátis pra testar. Em uma semana já estava no Starter. A Vi vendeu mais do que eu esperava.',
              name: 'Cris',
              store: 'Estilo Cris',
              emoji: '👩',
              highlight: 'A Vi vendeu mais do que eu esperava',
            },
          ].map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <div className="bg-surface border border-border rounded-2xl p-6 h-full flex flex-col gap-4 hover:border-primary/30 transition-all">
                <div className="flex">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} className="fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted leading-relaxed flex-1">
                  &ldquo;
                  {t.quote.split(t.highlight).map((part, idx, arr) => (
                    idx < arr.length - 1
                      ? <span key={idx}>{part}<strong className="text-foreground">{t.highlight}</strong></span>
                      : <span key={idx}>{part}</span>
                  ))}
                  &rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <span className="text-2xl">{t.emoji}</span>
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

      {/* ── Planos ────────────────────────────────────────────── */}
      <section id="planos" className="px-6 md:px-16 py-20 border-t border-border scroll-mt-24">
        <ScrollReveal>
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Planos</p>
          <h2 className="font-syne font-extrabold text-xl sm:text-3xl md:text-4xl leading-tight mb-4 max-w-2xl">
            Comece grátis.<br />Cresça quando quiser.
          </h2>
          <p className="text-muted text-sm mb-14">Sem fidelidade. Cancele quando quiser.</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Grátis */}
          <ScrollReveal delay={0}>
            <div className="bg-surface border border-border rounded-2xl p-7 w-full flex flex-col h-full">
              <h3 className="font-syne font-bold text-lg mb-2">Grátis</h3>
              <div className="font-syne font-extrabold text-4xl text-accent mb-1">
                R$ 0<span className="text-base text-muted">/mês</span>
              </div>
              <p className="text-xs text-muted mb-6">Para começar e testar</p>
              <ul className="flex flex-col gap-2.5 mb-7 flex-1 text-sm">
                {['Até 10 produtos', 'Vi assistente básica', 'Pedidos via WhatsApp', 'Painel de pedidos'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 size={13} className="text-accent shrink-0" /> {f}
                  </li>
                ))}
                {['IA no cadastro', 'Recuperação de pedido'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-muted">
                    <XCircle size={13} className="shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block text-center w-full py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:border-primary hover:text-primary transition-all min-h-[44px] flex items-center justify-center">
                Começar grátis
              </Link>
            </div>
          </ScrollReveal>

          {/* Starter */}
          <ScrollReveal delay={100}>
            <div className="bg-surface border border-border rounded-2xl p-7 w-full flex flex-col h-full">
              <h3 className="font-syne font-bold text-lg mb-2">Starter</h3>
              <div className="font-syne font-extrabold text-4xl text-accent mb-1">
                R$ 39,90<span className="text-base text-muted">/mês</span>
              </div>
              <p className="text-xs text-muted mb-6">Para começar a vender</p>
              <ul className="flex flex-col gap-2.5 mb-7 flex-1 text-sm">
                {['Até 25 produtos', 'Vi com IA real', 'IA no cadastro de produto', 'Pedidos via WhatsApp', 'Painel de pedidos'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 size={13} className="text-accent shrink-0" /> {f}
                  </li>
                ))}
                {['Recuperação de pedido'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-muted">
                    <XCircle size={13} className="shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block text-center w-full py-3 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/10 transition-all min-h-[44px] flex items-center justify-center">
                Começar e escolher Starter
              </Link>
            </div>
          </ScrollReveal>

          {/* Pro - Mais popular */}
          <ScrollReveal delay={200}>
            <div className="bg-surface border border-primary rounded-2xl p-7 w-full flex flex-col h-full shadow-[0_0_0_1px_var(--primary-dim),0_20px_60px_var(--primary-glow)]">
              <span className="inline-flex bg-primary text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-3">
                Mais popular
              </span>
              <h3 className="font-syne font-bold text-lg mb-2">Pro</h3>
              <div className="font-syne font-extrabold text-4xl text-accent mb-1">
                R$ 49,90<span className="text-base text-muted">/mês</span>
              </div>
              <p className="text-xs text-muted mb-6">Para lojas em crescimento</p>
              <ul className="flex flex-col gap-2.5 mb-7 flex-1 text-sm">
                {['Até 50 produtos', 'Vi com IA real', 'IA no cadastro de produto', 'Recuperação de pedido', 'Métricas avançadas', 'Suporte prioritário'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 size={13} className="text-accent shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="shimmer block text-center w-full py-3 rounded-xl bg-primary text-white font-syne font-bold text-sm hover:shadow-[0_4px_20px_var(--primary-glow)] hover:-translate-y-0.5 transition-all min-h-[44px] flex items-center justify-center">
                Começar e escolher Pro
              </Link>
            </div>
          </ScrollReveal>

          {/* Loja */}
          <ScrollReveal delay={300}>
            <div className="bg-surface border border-border rounded-2xl p-7 w-full flex flex-col h-full">
              <h3 className="font-syne font-bold text-lg mb-2">Loja</h3>
              <div className="font-syne font-extrabold text-4xl text-accent mb-1">
                R$ 99,90<span className="text-base text-muted">/mês</span>
              </div>
              <p className="text-xs text-muted mb-6">Para quem já vende muito</p>
              <ul className="flex flex-col gap-2.5 mb-7 flex-1 text-sm">
                {['Produtos ilimitados', 'Vi com IA real', 'IA no cadastro', 'Recuperação de pedido', 'Métricas completas', 'Suporte prioritário'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 size={13} className="text-accent shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block text-center w-full py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:border-primary hover:text-primary transition-all min-h-[44px] flex items-center justify-center">
                Começar e escolher Loja
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="px-6 md:px-16 py-20 border-t border-border scroll-mt-24">
        <ScrollReveal>
          <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">FAQ</p>
          <h2 className="font-syne font-extrabold text-3xl sm:text-4xl mb-10 leading-tight">
            Perguntas frequentes
          </h2>
        </ScrollReveal>

        <div className="max-w-2xl space-y-2">
          {[
            {
              q: 'Preciso saber de tecnologia para usar?',
              a: 'Não. O vend.ai foi feito pra quem nunca criou um site. Se você consegue usar o WhatsApp, consegue usar o vend.ai.',
            },
            {
              q: 'Posso cancelar quando quiser?',
              a: 'Sim. Nos planos pagos você pode cancelar a qualquer momento. Não há fidelidade nem multa.',
            },
            {
              q: 'O que a Vi faz exatamente?',
              a: 'A Vi é uma assistente com IA que atende seus clientes na loja: sugere produtos por estilo, cor ou tamanho, responde dúvidas e indica como finalizar o pedido pelo WhatsApp.',
            },
            {
              q: 'Qual o limite de produtos no plano grátis?',
              a: 'No plano Grátis você pode cadastrar até 10 produtos. Nos planos Starter (25), Pro (50) e Loja (ilimitado) o limite aumenta.',
            },
            {
              q: 'Como faço upgrade de plano?',
              a: 'Você começa criando sua loja grátis. Quando precisar de mais produtos e recursos, é só fazer upgrade para Starter, Pro ou Loja diretamente no painel.',
            },
            {
              q: 'Onde ficam meus dados? Vocês vendem meus dados?',
              a: 'Jamais. Seus dados e os da sua loja são armazenados de forma segura em servidores confiáveis. Não vendemos, compartilhamos ou usamos seus dados para fins comerciais. Trabalhamos em total conformidade com a LGPD (Lei 13.709/2018). Você pode solicitar exclusão dos seus dados a qualquer momento pelo e-mail privacidade@vend.ai.',
            },
            {
              q: 'Preciso de CNPJ para usar?',
              a: 'Não. Você pode criar sua loja como pessoa física. Não pedimos CNPJ para começar.',
            },
          ].map((item, i) => (
            <ScrollReveal key={i} delay={i * 50}>
              <details className="bg-surface border border-border rounded-xl overflow-hidden group">
                <summary className="px-5 py-4 cursor-pointer list-none font-syne font-bold text-sm flex items-center justify-between gap-3 hover:text-primary transition-colors">
                  <span>{item.q}</span>
                  <span className="text-muted group-open:rotate-180 transition-transform shrink-0 text-xs">▼</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-muted leading-relaxed">{item.a}</p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#7B6EFF18_0%,_transparent_65%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,_#00E5A010_0%,_transparent_50%)] pointer-events-none" />

        <ScrollReveal className="relative text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/40 bg-accent/10 text-accent text-xs font-bold mb-8">
            <Zap size={12} className="fill-accent" />
            Grátis para começar
          </div>
          <h2 className="font-syne font-extrabold text-3xl sm:text-4xl md:text-5xl mb-5 leading-tight">
            Sua loja de roupas online<br />
            <span className="text-grad">em 2 minutos. Grátis.</span>
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
              href="/bella-moda"
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

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="px-6 py-12 border-t border-border">
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
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center pt-6 border-t border-border">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <Link href="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
              <Link href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
              <span>privacidade@vend.ai</span>
            </div>
            <p className="text-xs text-muted">
              © {new Date().getFullYear()} vend.ai · LGPD compliant · Dados protegidos
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
