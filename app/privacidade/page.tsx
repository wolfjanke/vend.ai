import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade — vend.ai',
  description: 'Como o vend.ai coleta, usa e protege seus dados pessoais. Em conformidade com a LGPD (Lei 13.709/2018).',
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="font-syne font-bold text-lg text-foreground mb-4 pb-2 border-b border-border">{title}</h2>
    <div className="flex flex-col gap-3 text-sm text-muted leading-relaxed">
      {children}
    </div>
  </div>
)

export default function PrivacidadePage() {
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
          Política de Privacidade
        </h1>
        <p className="text-sm text-muted">
          Última atualização: 3 de abril de 2026 · Em conformidade com a{' '}
          <strong className="text-foreground">LGPD — Lei 13.709/2018</strong>
        </p>
      </div>

      <Section title="1. Quem somos (Controlador dos Dados)">
        <p>
          O <strong className="text-foreground">vend.ai</strong> é uma plataforma de catálogo digital com inteligência artificial voltada para lojistas de moda. Para fins da LGPD, o controlador dos dados é a empresa responsável pelo vend.ai, com canal de contato dedicado:
        </p>
        <p>
          <strong className="text-foreground">E-mail do Encarregado (DPO):</strong>{' '}
          <a href="mailto:privacidade@vend.ai" className="text-primary hover:underline">privacidade@vend.ai</a>
        </p>
        <p>
          Qualquer dúvida, solicitação ou exercício de direitos sobre seus dados pessoais deve ser enviado para esse endereço.
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <p>Coletamos apenas os dados necessários para o funcionamento do serviço:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-foreground font-syne font-bold">Dado</th>
                <th className="text-left py-2 pr-4 text-foreground font-syne font-bold">Finalidade</th>
                <th className="text-left py-2 text-foreground font-syne font-bold">Base Legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['Nome completo', 'Identificação e personalização da conta', 'Execução de contrato'],
                ['E-mail', 'Login, notificações e comunicação', 'Execução de contrato'],
                ['Número de WhatsApp', 'Receber pedidos dos clientes da sua loja', 'Execução de contrato'],
                ['Foto de perfil / logo', 'Personalização visual da loja', 'Consentimento'],
                ['Fotos de produtos', 'Exibição no catálogo da loja', 'Execução de contrato'],
                ['Dados da loja (nome, descrição)', 'Criar e exibir o catálogo público', 'Execução de contrato'],
                ['Dados de estoque', 'Controle e exibição de disponibilidade', 'Execução de contrato'],
                ['Dados de uso e navegação', 'Melhorar a plataforma e corrigir erros', 'Legítimo interesse'],
              ].map(([dado, fin, base]) => (
                <tr key={dado}>
                  <td className="py-2 pr-4 text-foreground">{dado}</td>
                  <td className="py-2 pr-4">{fin}</td>
                  <td className="py-2 text-primary">{base}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong className="text-foreground">Dados de clientes da sua loja:</strong> quando um cliente navega na sua loja e faz um pedido, os dados fornecidos (nome, endereço, preferências) são transmitidos diretamente para o seu WhatsApp. O vend.ai não armazena dados pessoais dos consumidores finais de forma permanente.
        </p>
      </Section>

      <Section title="3. Como usamos os dados">
        <p>Usamos seus dados exclusivamente para:</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Criar e gerenciar sua loja na plataforma</li>
          <li>Processar e encaminhar pedidos ao seu WhatsApp</li>
          <li>Operar a assistente de IA (Vi) com o catálogo da sua loja</li>
          <li>Enviar notificações essenciais sobre sua conta (e-mail)</li>
          <li>Melhorar e corrigir a plataforma com base em dados de uso anonimizados</li>
          <li>Cumprir obrigações legais</li>
        </ul>
        <p>
          <strong className="text-foreground">Não usamos seus dados para publicidade de terceiros.</strong> Não vendemos, alugamos ou compartilhamos suas informações pessoais com fins comerciais.
        </p>
      </Section>

      <Section title="4. Compartilhamento com terceiros">
        <p>Para funcionar, o vend.ai utiliza serviços de infraestrutura confiáveis. Abaixo os fornecedores e o que recebem:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1">
          <li>
            <strong className="text-foreground">Neon / Supabase</strong> — banco de dados onde ficam os dados da sua loja e conta. Servidores seguros com criptografia em repouso.
          </li>
          <li>
            <strong className="text-foreground">Cloudinary</strong> — armazenamento das fotos de produtos e logo da sua loja.
          </li>
          <li>
            <strong className="text-foreground">Resend</strong> — envio de e-mails transacionais (confirmação de conta, notificações).
          </li>
          <li>
            <strong className="text-foreground">OpenAI</strong> — processamento de linguagem natural para a assistente Vi e a IA de cadastro de produtos. As fotos e descrições enviadas podem ser processadas nos servidores da OpenAI conforme a política deles.
          </li>
        </ul>
        <p>
          Todos os fornecedores são escolhidos por cumprirem padrões de segurança e privacidade reconhecidos internacionalmente (ISO 27001, SOC 2 ou equivalente).
        </p>
        <p>
          Podemos divulgar dados quando exigido por lei, ordem judicial ou autoridade competente.
        </p>
      </Section>

      <Section title="5. Prazo de retenção">
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Dados da conta e loja: mantidos enquanto a conta estiver ativa.</li>
          <li>Após exclusão da conta: dados excluídos em até <strong className="text-foreground">30 dias</strong>, salvo obrigação legal de retenção.</li>
          <li>Logs de acesso: mantidos por <strong className="text-foreground">6 meses</strong> conforme exige o Marco Civil da Internet (Lei 12.965/2014).</li>
          <li>Backups: eliminados em até 90 dias após a exclusão da conta.</li>
        </ul>
      </Section>

      <Section title="6. Seus direitos como titular dos dados">
        <p>A LGPD garante os seguintes direitos, que você pode exercer a qualquer momento pelo e-mail <a href="mailto:privacidade@vend.ai" className="text-primary hover:underline">privacidade@vend.ai</a>:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1">
          <li><strong className="text-foreground">Acesso</strong> — confirmar se tratamos seus dados e obter uma cópia.</li>
          <li><strong className="text-foreground">Correção</strong> — corrigir dados incompletos, inexatos ou desatualizados.</li>
          <li><strong className="text-foreground">Exclusão</strong> — solicitar a exclusão de dados tratados com base em consentimento.</li>
          <li><strong className="text-foreground">Portabilidade</strong> — receber seus dados em formato estruturado e legível.</li>
          <li><strong className="text-foreground">Oposição</strong> — opor-se a tratamentos baseados em legítimo interesse.</li>
          <li><strong className="text-foreground">Revogação do consentimento</strong> — retirar consentimento dado anteriormente.</li>
          <li><strong className="text-foreground">Informação sobre compartilhamento</strong> — saber com quais entidades compartilhamos seus dados.</li>
        </ul>
        <p>Respondemos às solicitações em até <strong className="text-foreground">15 dias úteis</strong>.</p>
      </Section>

      <Section title="7. Cookies e rastreamento">
        <p>
          Usamos cookies essenciais para manter sua sessão autenticada. Não utilizamos cookies de rastreamento publicitário de terceiros.
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li><strong className="text-foreground">Cookies de sessão</strong> — necessários para login e autenticação. Expiram ao fechar o navegador.</li>
          <li><strong className="text-foreground">Cookies de preferência</strong> — armazenam configurações da sua conta.</li>
        </ul>
        <p>
          Você pode desativar cookies nas configurações do seu navegador, mas isso pode afetar o funcionamento da plataforma.
        </p>
      </Section>

      <Section title="8. Segurança dos dados">
        <p>Adotamos as seguintes medidas técnicas e organizacionais:</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Transmissão de dados via HTTPS/TLS</li>
          <li>Criptografia de senhas com algoritmo bcrypt</li>
          <li>Acesso restrito por função (role-based access)</li>
          <li>Monitoramento de acessos e logs de auditoria</li>
          <li>Backups regulares com criptografia em repouso</li>
        </ul>
        <p>
          Em caso de incidente de segurança que afete seus dados, notificaremos você e a ANPD conforme os prazos da LGPD.
        </p>
      </Section>

      <Section title="9. Transferência internacional de dados">
        <p>
          Alguns de nossos fornecedores (Cloudinary, OpenAI, Resend) podem processar dados em servidores fora do Brasil. Garantimos que essas transferências ocorrem apenas para países ou organizações que oferecem grau de proteção equivalente ao da LGPD, ou mediante cláusulas contratuais adequadas.
        </p>
      </Section>

      <Section title="10. Alterações nesta política">
        <p>
          Esta política pode ser atualizada periodicamente. Quando houver mudanças relevantes, notificaremos você por e-mail com pelo menos 15 dias de antecedência. O uso continuado da plataforma após as alterações implica aceitação da nova versão.
        </p>
      </Section>

      <Section title="11. Contato e canal de atendimento">
        <p>
          Para qualquer questão relacionada à privacidade, proteção de dados ou exercício dos seus direitos:
        </p>
        <p>
          <strong className="text-foreground">E-mail:</strong>{' '}
          <a href="mailto:privacidade@vend.ai" className="text-primary hover:underline">privacidade@vend.ai</a>
          <br />
          Prazo de resposta: até 15 dias úteis.
        </p>
        <p>
          Você também pode acionar a <strong className="text-foreground">ANPD (Autoridade Nacional de Proteção de Dados)</strong> em{' '}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.gov.br/anpd</a>.
        </p>
      </Section>

      <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Link href="/termos" className="text-sm text-primary hover:underline">
          Ver Termos de Uso →
        </Link>
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft size={13} />
          Voltar para o vend.ai
        </Link>
      </div>
    </main>
  )
}
