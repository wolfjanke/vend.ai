import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso — vend.ai',
  description: 'Termos e condições de uso da plataforma vend.ai.',
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="font-syne font-bold text-lg text-foreground mb-4 pb-2 border-b border-border">{title}</h2>
    <div className="flex flex-col gap-3 text-sm text-muted leading-relaxed">
      {children}
    </div>
  </div>
)

export default function TermosPage() {
  return (
    <main className="relative z-10 min-h-screen px-6 md:px-16 py-12 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-10"
      >
        <ArrowLeft size={14} />
        Voltar para o início
      </Link>

      <div className="mb-10">
        <p className="text-xs font-bold tracking-[2px] uppercase text-primary mb-3">Legal</p>
        <h1 className="font-syne font-extrabold text-3xl sm:text-4xl mb-3 text-foreground">
          Termos de Uso
        </h1>
        <p className="text-sm text-muted">
          Última atualização: 3 de abril de 2026
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl px-5 py-4 mb-10 text-sm text-muted">
        Ao criar uma conta no vend.ai, você concorda com estes Termos de Uso. Leia com atenção antes de utilizar a plataforma.
      </div>

      <Section title="1. O que é o vend.ai">
        <p>
          O <strong className="text-foreground">vend.ai</strong> é uma plataforma de catálogo digital com inteligência artificial que permite a lojistas de moda criarem uma loja online, gerenciarem produtos e receberem pedidos via WhatsApp.
        </p>
        <p>
          A plataforma inclui:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Criação e publicação de catálogo digital</li>
          <li>Assistente de IA (Vi) para atendimento automatizado</li>
          <li>Integração com WhatsApp para recebimento de pedidos</li>
          <li>Painel de controle de produtos, estoque e pedidos</li>
          <li>IA para geração de nome e descrição de produtos a partir de fotos</li>
        </ul>
      </Section>

      <Section title="2. Aceitação dos termos">
        <p>
          Ao se cadastrar, acessar ou utilizar o vend.ai, você declara ter lido e aceito estes Termos de Uso e nossa{' '}
          <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
        </p>
        <p>
          Se você não concorda com os termos, não utilize a plataforma.
        </p>
        <p>
          Você deve ter pelo menos 18 anos ou ser emancipado legalmente para criar uma conta. Menores de 18 anos podem utilizar apenas com autorização e supervisão dos responsáveis legais.
        </p>
      </Section>

      <Section title="3. Criação de conta e responsabilidades">
        <p>
          Você é responsável por:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Manter a confidencialidade da sua senha de acesso</li>
          <li>Todas as atividades realizadas com sua conta</li>
          <li>Fornecer informações verdadeiras no cadastro e no catálogo</li>
          <li>Manter seus dados de contato atualizados (especialmente o WhatsApp)</li>
        </ul>
        <p>
          Em caso de suspeita de acesso não autorizado, notifique-nos imediatamente em{' '}
          <a href="mailto:suporte@vend.ai" className="text-primary hover:underline">suporte@vend.ai</a>.
        </p>
      </Section>

      <Section title="4. Uso permitido da plataforma">
        <p>Você pode usar o vend.ai para:</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Criar e gerenciar sua loja de moda ou roupas</li>
          <li>Cadastrar produtos próprios ou de terceiros que você legalmente revende</li>
          <li>Receber e gerenciar pedidos de clientes</li>
          <li>Usar a IA para facilitar o cadastro de produtos e atendimento</li>
        </ul>
      </Section>

      <Section title="5. Uso proibido">
        <p>É estritamente proibido:</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Cadastrar produtos ilegais, falsificados, piratas ou proibidos por lei</li>
          <li>Usar a plataforma para enviar spam ou comunicações não solicitadas</li>
          <li>Tentar acessar sistemas, contas ou dados de outros usuários sem autorização</li>
          <li>Fazer engenharia reversa, descompilar ou tentar extrair o código-fonte da plataforma</li>
          <li>Usar scripts, bots ou automações não autorizadas para acessar a plataforma</li>
          <li>Revender o serviço ou criar contas em nome de terceiros sem autorização</li>
          <li>Publicar conteúdo que viole direitos autorais, marcas registradas ou direitos de terceiros</li>
          <li>Usar a plataforma para atividades ilegais, fraudulentas ou que prejudiquem terceiros</li>
        </ul>
        <p>
          O descumprimento dessas regras pode resultar na suspensão ou exclusão permanente da conta, sem direito a reembolso.
        </p>
      </Section>

      <Section title="6. Planos e pagamentos">
        <p>
          O vend.ai oferece um plano gratuito e planos pagos (Starter, Pro, Loja). Os preços e benefícios de cada plano estão descritos na página principal.
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Os planos pagos são cobrados mensalmente de forma recorrente.</li>
          <li>Você pode cancelar a qualquer momento, sem multa. O acesso se mantém até o fim do período já pago.</li>
          <li>Não realizamos reembolsos proporcionais por cancelamento antecipado no período vigente.</li>
          <li>Podemos alterar os preços com aviso prévio de 30 dias por e-mail.</li>
          <li>Em caso de inadimplência, a conta pode ser rebaixada para o plano gratuito.</li>
        </ul>
      </Section>

      <Section title="7. Propriedade intelectual">
        <p>
          <strong className="text-foreground">Do vend.ai:</strong> todo o código, design, interface, marca e tecnologia da plataforma são propriedade do vend.ai e protegidos por direitos autorais e marcas registradas.
        </p>
        <p>
          <strong className="text-foreground">Do usuário:</strong> você mantém todos os direitos sobre os conteúdos que publica (fotos, descrições, nome da loja). Ao publicar esses conteúdos, você nos concede uma licença não exclusiva para exibir e processar esses dados exclusivamente para operar a plataforma em seu benefício.
        </p>
      </Section>

      <Section title="8. Disponibilidade e funcionamento">
        <p>
          Nos esforçamos para manter o vend.ai disponível 24h por dia, mas não garantimos disponibilidade ininterrupta. Podem ocorrer pausas para manutenção, atualizações ou por motivos de força maior.
        </p>
        <p>
          A assistente Vi opera com inteligência artificial. As respostas são geradas automaticamente e podem, ocasionalmente, conter imprecisões. Você é responsável por revisar o funcionamento da Vi na sua loja e corrigir informações incorretas no catálogo.
        </p>
      </Section>

      <Section title="9. Limitação de responsabilidade">
        <p>
          O vend.ai não se responsabiliza por:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Perdas de vendas ou lucros cessantes por indisponibilidade da plataforma</li>
          <li>Conteúdo publicado pelos usuários em suas lojas</li>
          <li>Transações comerciais entre lojistas e seus clientes finais</li>
          <li>Respostas geradas pela IA que contenham imprecisões</li>
          <li>Problemas decorrentes de uso inadequado da plataforma</li>
        </ul>
        <p>
          A responsabilidade do vend.ai em qualquer hipótese fica limitada ao valor pago pelo usuário nos últimos 3 meses.
        </p>
      </Section>

      <Section title="10. Rescisão">
        <p>
          <strong className="text-foreground">Por você:</strong> você pode encerrar sua conta a qualquer momento acessando as configurações da conta ou entrando em contato pelo e-mail <a href="mailto:suporte@vend.ai" className="text-primary hover:underline">suporte@vend.ai</a>.
        </p>
        <p>
          <strong className="text-foreground">Por nós:</strong> podemos suspender ou encerrar sua conta caso haja violação destes Termos, inadimplência ou uso inadequado da plataforma. Em casos graves, a suspensão pode ser imediata sem aviso prévio.
        </p>
        <p>
          Após o encerramento da conta, seus dados serão excluídos conforme a{' '}
          <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
        </p>
      </Section>

      <Section title="11. Alterações nos termos">
        <p>
          Podemos atualizar estes Termos periodicamente. Quando houver mudanças relevantes, notificaremos por e-mail com pelo menos 15 dias de antecedência. O uso continuado da plataforma após as alterações implica aceitação dos novos termos.
        </p>
      </Section>

      <Section title="12. Lei aplicável e foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir eventuais controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.
        </p>
      </Section>

      <Section title="13. Contato">
        <p>
          Para dúvidas sobre estes Termos de Uso:
        </p>
        <p>
          <strong className="text-foreground">Suporte geral:</strong>{' '}
          <a href="mailto:suporte@vend.ai" className="text-primary hover:underline">suporte@vend.ai</a>
          <br />
          <strong className="text-foreground">Privacidade e dados:</strong>{' '}
          <a href="mailto:privacidade@vend.ai" className="text-primary hover:underline">privacidade@vend.ai</a>
        </p>
      </Section>

      <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Link href="/privacidade" className="text-sm text-primary hover:underline">
          Ver Política de Privacidade →
        </Link>
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft size={13} />
          Voltar para o vend.ai
        </Link>
      </div>
    </main>
  )
}
