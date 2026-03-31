import Link from 'next/link'
import LandingHeader from '@/components/landing/LandingHeader'

export default function LandingPage() {
  return (
    <main className="relative z-10">
      <div className="relative">
        <LandingHeader />
      </div>

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
            <Link href="/bella-moda" className="font-medium px-6 py-3.5 rounded-xl border border-border text-foreground hover:border-primary hover:text-primary transition-all" title="Ver loja de exemplo com a Vi em ação">
              Ver demonstração — loja de exemplo com a Vi
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

      {/* Prova social + Para quem é + Comparação */}
      <section className="px-6 md:px-16 py-20 border-t border-border">
        <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Prova social</p>
        <h2 className="font-syne font-extrabold text-3xl md:text-4xl mb-8">+1.200 lojistas já vendem com o vend.ai</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <p className="text-sm text-muted italic mb-3">&ldquo;Montei minha loja em um dia. A Vi atende meus clientes e os pedidos chegam certinhos no WhatsApp.&rdquo;</p>
            <p className="font-syne font-bold text-sm">Maria, Brechó da Maria</p>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-6">
            <p className="text-sm text-muted italic mb-3">&ldquo;A IA no cadastro salvou horas. Foto da peça e já tenho nome e descrição.&rdquo;</p>
            <p className="font-syne font-bold text-sm">Ana, Moda &amp; Você</p>
          </div>
        </div>
        <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Para quem é</p>
        <h2 className="font-syne font-extrabold text-2xl md:text-3xl mb-6">Feito para quem vende moda</h2>
        <div className="flex flex-wrap gap-3 mb-10">
          {['Revendedoras', 'Brechós', 'Pequenas marcas', 'Lojas de roupas', 'Quem vende no Instagram'].map(label => (
            <span key={label} className="px-4 py-2 bg-surface2 border border-border rounded-full text-sm text-foreground">{label}</span>
          ))}
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 max-w-2xl">
          <p className="text-sm text-foreground">
            <strong>Por que não só link no bio?</strong> Porque no vend.ai você tem catálogo inteligente, IA que sugere produtos ao cliente e pedido formatado direto no seu WhatsApp — sem planilha, sem confusão.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="px-6 md:px-16 py-20 border-t border-border scroll-mt-24">
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
      <section id="funcionalidades" className="px-6 md:px-16 py-20 border-t border-border scroll-mt-24">
        <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Funcionalidades</p>
        <h2 className="font-syne font-extrabold text-3xl md:text-4xl mb-12">Tudo que você precisa.<br />Nada que você não usa.</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: '🤖', title: 'Vi — Assistente com IA', desc: 'A Vi atende seus clientes 24h, sugere produtos e responde dúvidas. Nos planos Pro+, você recupera pedidos não concluídos pelo painel com mensagens prontas.', wide: true },
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
      <section id="planos" className="px-6 md:px-16 py-20 border-t border-border scroll-mt-24">
        <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Planos</p>
        <h2 className="font-syne font-extrabold text-xl sm:text-3xl md:text-4xl leading-tight mb-14 md:mb-16 max-w-2xl">
          Comece grátis.<br />Cresça quando quiser.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-3 md:mt-5">
          {/* Grátis */}
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-none min-w-0">
            <h3 className="font-syne font-bold text-lg mb-2">Grátis</h3>
            <div className="font-syne font-extrabold text-4xl text-accent mb-1">R$ 0<span className="text-base text-muted">/mês</span></div>
            <p className="text-xs text-muted mb-5">Para começar e testar</p>
            <ul className="flex flex-col gap-2 mb-6 text-sm">
              {['Até 10 produtos', 'Vi assistente básica', 'Pedidos via WhatsApp', 'Painel de pedidos'].map(f => (
                <li key={f} className="text-foreground">✓ {f}</li>
              ))}
              {['IA no cadastro de produto', 'Recuperação de pedido'].map(f => (
                <li key={f} className="text-muted">✗ {f}</li>
              ))}
            </ul>
            <Link href="/cadastro" className="block text-center w-full py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:border-primary hover:text-primary transition-all">
              Começar grátis
            </Link>
          </div>
          {/* Starter */}
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-none min-w-0">
            <h3 className="font-syne font-bold text-lg mb-2">Starter</h3>
            <div className="font-syne font-extrabold text-4xl text-accent mb-1">R$ 39,90<span className="text-base text-muted">/mês</span></div>
            <p className="text-xs text-muted mb-5">Para começar a vender</p>
            <ul className="flex flex-col gap-2 mb-6 text-sm">
              {['Até 25 produtos', 'Vi com IA real', 'IA no cadastro de produto', 'Pedidos via WhatsApp', 'Painel de pedidos'].map(f => (
                <li key={f} className="text-foreground">✓ {f}</li>
              ))}
              {['Recuperação de pedido'].map(f => (
                <li key={f} className="text-muted">✗ {f}</li>
              ))}
            </ul>
            <Link href="/cadastro" className="block text-center w-full py-3 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/10 transition-all">
              Começar e escolher Starter
            </Link>
          </div>
          {/* Pro - Mais popular */}
          <div className="bg-surface border border-primary rounded-2xl p-8 w-full max-w-none min-w-0 shadow-[0_0_0_1px_var(--primary-dim),0_20px_60px_var(--primary-glow)]">
            <span className="inline-flex bg-primary text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap mb-3">Mais popular</span>
            <h3 className="font-syne font-bold text-lg mb-2">Pro</h3>
            <div className="font-syne font-extrabold text-4xl text-accent mb-1">R$ 49,90<span className="text-base text-muted">/mês</span></div>
            <p className="text-xs text-muted mb-5">Para lojas em crescimento</p>
            <ul className="flex flex-col gap-2 mb-6 text-sm">
              {['Até 50 produtos', 'Vi com IA real', 'IA no cadastro de produto', 'Recuperação de pedido', 'Métricas melhores', 'Suporte prioritário'].map(f => (
                <li key={f} className="text-foreground">✓ {f}</li>
              ))}
            </ul>
            <Link href="/cadastro" className="block text-center w-full py-3 rounded-xl bg-primary text-white font-syne font-bold text-sm hover:shadow-[0_4px_20px_var(--primary-glow)] hover:-translate-y-0.5 transition-all">
              Começar e escolher Pro
            </Link>
          </div>
          {/* Loja */}
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-none min-w-0">
            <h3 className="font-syne font-bold text-lg mb-2">Loja</h3>
            <div className="font-syne font-extrabold text-4xl text-accent mb-1">R$ 99,90<span className="text-base text-muted">/mês</span></div>
            <p className="text-xs text-muted mb-5">Para quem já vende muito</p>
            <ul className="flex flex-col gap-2 mb-6 text-sm">
              {['Produtos ilimitados', 'Vi com IA real', 'IA no cadastro', 'Recuperação de pedido', 'Métricas completas', 'Suporte prioritário'].map(f => (
                <li key={f} className="text-foreground">✓ {f}</li>
              ))}
            </ul>
            <Link href="/cadastro" className="block text-center w-full py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:border-primary hover:text-primary transition-all">
              Começar e escolher Loja
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 md:px-16 py-20 border-t border-border scroll-mt-24">
        <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">FAQ</p>
        <h2 className="font-syne font-extrabold text-3xl md:text-4xl mb-10">Perguntas frequentes</h2>
        <div className="max-w-2xl space-y-2">
          <details className="bg-surface border border-border rounded-xl overflow-hidden group">
            <summary className="px-5 py-4 cursor-pointer list-none font-syne font-bold text-sm flex items-center justify-between">
              Posso cancelar quando quiser?
              <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-5 pb-4 text-sm text-muted">Sim. Nos planos pagos você pode cancelar a qualquer momento. Não há fidelidade.</p>
          </details>
          <details className="bg-surface border border-border rounded-xl overflow-hidden group">
            <summary className="px-5 py-4 cursor-pointer list-none font-syne font-bold text-sm flex items-center justify-between">
              O que a Vi faz exatamente?
              <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-5 pb-4 text-sm text-muted">A Vi é uma assistente com IA que atende seus clientes na loja: sugere produtos por estilo, cor ou tamanho, responde dúvidas e indica como finalizar o pedido pelo WhatsApp.</p>
          </details>
          <details className="bg-surface border border-border rounded-xl overflow-hidden group">
            <summary className="px-5 py-4 cursor-pointer list-none font-syne font-bold text-sm flex items-center justify-between">
              Qual o limite de produtos no plano grátis?
              <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-5 pb-4 text-sm text-muted">No plano Grátis você pode cadastrar até 10 produtos. Nos planos Starter (25), Pro (50) e Loja (ilimitado) o limite aumenta.</p>
          </details>
          <details className="bg-surface border border-border rounded-xl overflow-hidden group">
            <summary className="px-5 py-4 cursor-pointer list-none font-syne font-bold text-sm flex items-center justify-between">
              Como faço upgrade de plano?
              <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-5 pb-4 text-sm text-muted">Você começa criando sua loja grátis. Quando precisar de mais produtos e recursos, é só fazer upgrade para Starter, Pro ou Loja.</p>
          </details>
          <details className="bg-surface border border-border rounded-xl overflow-hidden group">
            <summary className="px-5 py-4 cursor-pointer list-none font-syne font-bold text-sm flex items-center justify-between">
              Onde ficam meus dados?
              <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-5 pb-4 text-sm text-muted">Seus dados e da sua loja são armazenados de forma segura. Trabalhamos em conformidade com a LGPD.</p>
          </details>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-border text-center">
        <div className="font-syne font-extrabold text-2xl text-grad mb-2">vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai</div>
        <p className="text-sm text-muted">Feito com ✦ para lojistas que querem vender mais</p>
        <p className="text-xs text-muted mt-3">Seus dados protegidos. Em conformidade com a LGPD.</p>
      </footer>
    </main>
  )
}
