import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border h-16 flex items-center justify-between px-6 animate-slide-down">
        <span className="font-syne font-extrabold text-xl text-grad">vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)', opacity: 1 }}>.</span>ai</span>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted">
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#funcionalidades"  className="hover:text-foreground transition-colors">Funcionalidades</a>
          <a href="#planos"           className="hover:text-foreground transition-colors">Planos</a>
        </nav>
        <div className="flex gap-3">
          <Link href="/admin" className="text-sm font-medium text-muted hover:text-foreground transition-colors px-3 py-2">
            Entrar
          </Link>
          <Link href="/cadastro" className="text-sm font-bold px-4 py-2 rounded-xl bg-grad text-bg hover:opacity-90 transition-opacity">
            Criar loja grátis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-[calc(100vh-64px)] flex items-center px-6 md:px-16 gap-16 relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] -top-24 -left-24 bg-[radial-gradient(circle,_#7B6EFF0D,_transparent_70%)] pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] bottom-0 right-48 bg-[radial-gradient(circle,_#00E5A00A,_transparent_70%)] pointer-events-none" />

        <div className="flex-1 max-w-xl animate-fade-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-6">
            ✦ Plataforma com IA para moda
          </div>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight mb-5">
            Sua loja no digital<br />
            <span className="text-grad">em 2 minutos.</span>
          </h1>
          <p className="text-muted text-base leading-relaxed mb-8 max-w-md">
            Catálogo inteligente + IA assistente + pedidos direto no WhatsApp. Sem complicação, sem mensalidade cara.
          </p>
          <div className="flex gap-3 flex-wrap mb-8">
            <Link href="/cadastro" className="font-syne font-bold px-6 py-3.5 rounded-xl bg-grad text-bg hover:opacity-90 hover:-translate-y-0.5 transition-all">
              Criar minha loja grátis →
            </Link>
            <Link href="/bella-moda" className="font-medium px-6 py-3.5 rounded-xl border border-border text-foreground hover:border-primary hover:text-primary transition-all">
              Ver demonstração
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              {['👩', '👩‍🦱', '👩‍🦰', '🧕'].map((e, i) => (
                <span key={i} className="text-xl">{e}</span>
              ))}
            </div>
            <span className="text-sm text-muted">+1.200 lojistas já usam o vend.ai</span>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="hidden lg:block flex-shrink-0 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-52 bg-surface border border-border rounded-[32px] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_0_1px_#7B6EFF22]">
            <div className="bg-surface2 rounded-[20px] p-3 overflow-hidden">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-syne font-extrabold text-xs text-grad">vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai</span>
                <span className="text-[10px] text-muted">Bella Moda</span>
              </div>
              <div className="flex gap-2 mb-2.5">
                {[['👗','Vestido Rosa','R$89'], ['✨','Conjunto','R$189']].map(([emoji, name, price]) => (
                  <div key={name} className="flex-1 bg-surface rounded-[10px] p-2 border border-border text-center">
                    <div className="text-2xl mb-1">{emoji}</div>
                    <div className="text-[10px] text-foreground">{name}</div>
                    <div className="text-accent text-[11px] font-bold">{price}</div>
                  </div>
                ))}
              </div>
              <div className="bg-bg rounded-[10px] p-2 flex flex-col gap-1.5 mb-2.5">
                <div className="bg-surface2 text-[10px] px-2 py-1 rounded-lg rounded-bl-[2px] self-start max-w-[80%]">Olá! Posso te ajudar? ✦</div>
                <div className="bg-primary/20 border border-primary/30 text-[10px] px-2 py-1 rounded-lg rounded-br-[2px] self-end max-w-[80%]">Vestido para festa P</div>
                <div className="bg-surface2 text-[10px] px-2 py-1 rounded-lg rounded-bl-[2px] self-start max-w-[80%]">Encontrei 2 opções! 🎉</div>
              </div>
              <div className="bg-accent text-bg text-[10px] font-bold text-center py-1.5 rounded-lg font-syne">Finalizar pelo WhatsApp</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="px-6 md:px-16 py-20 border-t border-border">
        <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Como funciona</p>
        <h2 className="font-syne font-extrabold text-3xl md:text-4xl mb-12">Do cadastro à venda<br />em 3 passos</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: '01', icon: '🏪', title: 'Crie sua loja', desc: 'Cadastre em 2 minutos. Foto, nome, WhatsApp e seu link está no ar.' },
            { n: '02', icon: '📸', title: 'Adicione produtos com IA', desc: 'Tire uma foto e a IA cria nome, descrição e categoria automaticamente.' },
            { n: '03', icon: '💬', title: 'Receba pedidos no WhatsApp', desc: 'Cliente escolhe, monta o carrinho e o pedido chega formatado no seu WhatsApp.' },
          ].map(step => (
            <div key={step.n} className="relative bg-surface border border-border rounded-2xl p-7 hover:border-primary hover:-translate-y-1 hover:shadow-[0_10px_40px_var(--primary-glow)] transition-all">
              <span className="absolute top-4 right-5 font-syne font-extrabold text-5xl text-primary/10 leading-none">{step.n}</span>
              <div className="text-4xl mb-3">{step.icon}</div>
              <h3 className="font-syne font-bold text-base mb-2">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="px-6 md:px-16 py-20 border-t border-border">
        <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Funcionalidades</p>
        <h2 className="font-syne font-extrabold text-3xl md:text-4xl mb-12">Tudo que você precisa.<br />Nada que você não usa.</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: '🤖', title: 'Vi — Assistente com IA', desc: 'A Vi atende seus clientes 24h, sugere produtos, responde dúvidas e recupera carrinhos abandonados.', wide: true },
            { icon: '📲', title: 'WhatsApp integrado',    desc: 'Pedidos chegam formatados no WhatsApp que você já usa.' },
            { icon: '📊', title: 'Painel de controle',    desc: 'Gerencie pedidos, estoque e métricas em um lugar só.' },
            { icon: '📸', title: 'IA no cadastro',        desc: 'Tire foto do produto e a IA gera nome e descrição na hora.' },
            { icon: '📦', title: 'Controle de estoque',   desc: 'Por tamanho e cor, com alertas de estoque baixo automáticos.' },
          ].map(f => (
            <div key={f.title} className={`bg-surface border border-border rounded-[18px] p-6 hover:border-primary/40 transition-all ${f.wide ? 'md:col-span-2 lg:col-span-1' : ''}`}>
              <div className="text-[28px] mb-2.5">{f.icon}</div>
              <h3 className="font-syne font-bold text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="px-6 md:px-16 py-20 border-t border-border">
        <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Planos</p>
        <h2 className="font-syne font-extrabold text-3xl md:text-4xl mb-12">Comece grátis.<br />Cresça quando quiser.</h2>
        <div className="flex flex-wrap gap-5 justify-center">
          {/* Free */}
          <div className="bg-surface border border-border rounded-2xl p-8 flex-1 min-w-[240px] max-w-xs">
            <h3 className="font-syne font-bold text-lg mb-2">Grátis</h3>
            <div className="font-syne font-extrabold text-4xl text-accent mb-1">R$ 0<span className="text-base text-muted">/mês</span></div>
            <p className="text-xs text-muted mb-5">Para começar e testar</p>
            <ul className="flex flex-col gap-2 mb-6 text-sm">
              {['Até 20 produtos', 'Vi assistente básica', 'Pedidos via WhatsApp', 'Painel de pedidos'].map(f => (
                <li key={f} className="text-foreground">✓ {f}</li>
              ))}
              {['IA no cadastro de produto', 'Recuperação de carrinho'].map(f => (
                <li key={f} className="text-muted">✗ {f}</li>
              ))}
            </ul>
            <Link href="/cadastro" className="block text-center w-full py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:border-primary hover:text-primary transition-all">
              Começar grátis
            </Link>
          </div>
          {/* Pro */}
          <div className="relative bg-surface border border-primary rounded-2xl p-8 flex-1 min-w-[240px] max-w-xs shadow-[0_0_0_1px_var(--primary-dim),0_20px_60px_var(--primary-glow)]">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">Mais popular</span>
            <h3 className="font-syne font-bold text-lg mb-2">Pro</h3>
            <div className="font-syne font-extrabold text-4xl text-accent mb-1">R$ 49<span className="text-base text-muted">/mês</span></div>
            <p className="text-xs text-muted mb-5">Para lojas em crescimento</p>
            <ul className="flex flex-col gap-2 mb-6 text-sm">
              {['Produtos ilimitados', 'Vi completa com IA real', 'IA no cadastro de produto', 'Recuperação de carrinho', 'Métricas avançadas', 'Suporte prioritário'].map(f => (
                <li key={f} className="text-foreground">✓ {f}</li>
              ))}
            </ul>
            <Link href="/cadastro" className="block text-center w-full py-3 rounded-xl bg-primary text-white font-syne font-bold text-sm hover:shadow-[0_4px_20px_var(--primary-glow)] hover:-translate-y-0.5 transition-all">
              Assinar Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-border text-center">
        <div className="font-syne font-extrabold text-2xl text-grad mb-2">vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai</div>
        <p className="text-sm text-muted">Feito com ✦ para lojistas que querem vender mais</p>
      </footer>
    </main>
  )
}
