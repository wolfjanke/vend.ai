import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { COMPANY, companyCityShort } from '@/lib/company'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1A1A1A',
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#7B6EFF',
    paddingBottom: 16,
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#7B6EFF',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#7B6EFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 10,
    marginBottom: 6,
    color: '#333333',
  },
  highlight: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB800',
  },
  highlightTitle: {
    fontSize: 10,
    color: '#7A5900',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 10,
    color: '#7A5900',
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
  },
  signatureBox: {
    marginTop: 30,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  signatureText: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
  },
})

export interface TermsPdfProps {
  storeName: string
  ownerName: string
  email: string
  plan: string
  planPrice: string
  acceptedAt: string
  acceptedIp: string
  storeSlug: string
  termsVersion: string
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Grátis — R$0,00/mês',
  starter: 'Starter — R$49,90/mês',
  pro: 'Pro — R$99,90/mês',
  loja: 'Loja — R$199,90/mês',
  enterprise: 'Enterprise — R$399,90/mês',
}

export function TermsPdfDocument({
  storeName,
  ownerName,
  email,
  plan,
  acceptedAt,
  acceptedIp,
  storeSlug,
  termsVersion,
}: TermsPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>vend.ai</Text>
          <Text style={styles.title}>Contrato de Uso da Plataforma</Text>
          <Text style={styles.subtitle}>
            {COMPANY.name} · CNPJ {COMPANY.cnpj}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Contratante</Text>
          <Text style={styles.text}>Nome: {ownerName}</Text>
          <Text style={styles.text}>E-mail: {email}</Text>
          <Text style={styles.text}>Loja: {storeName}</Text>
          <Text style={styles.text}>Link da loja: vendai.club/{storeSlug}</Text>
          <Text style={styles.text}>Plano contratado: {PLAN_LABELS[plan] ?? plan}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Objeto do Contrato</Text>
          <Text style={styles.text}>
            O presente contrato tem por objeto a licença de uso da plataforma vend.ai,
            sistema de vendas online com inteligência artificial, operado pela {COMPANY.name},
            CNPJ {COMPANY.cnpj}, com sede em {companyCityShort()}, doravante denominada CONTRATADA.
          </Text>
          <Text style={styles.text}>
            O CONTRATANTE terá acesso às funcionalidades do plano contratado conforme
            descrição disponível em vendai.club, podendo fazer upgrade ou cancelar
            a qualquer momento.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Planos e Cobrança</Text>
          <Text style={styles.text}>• A cobrança é mensal e renovada automaticamente na data de contratação.</Text>
          <Text style={styles.text}>• O plano Grátis não possui cobrança de assinatura.</Text>
          <Text style={styles.text}>• Planos pagos possuem período de trial conforme descrito na plataforma.</Text>
          <Text style={styles.text}>
            • Sobre transações realizadas via checkout integrado incide take rate
            conforme o plano contratado (4,5% Grátis · 4,0% Starter · 2,75% Pro ·
            1,7% Loja · 1,5% Enterprise).
          </Text>
          <Text style={styles.text}>
            • Mensagens da assistente Vi que ultrapassarem o limite do plano serão
            cobradas proporcionalmente conforme tabela vigente na plataforma.
          </Text>
          <Text style={styles.text}>
            • Cancelamento pode ser feito a qualquer momento sem multa, com acesso
            mantido até o final do período pago.
          </Text>
        </View>

        <View style={styles.highlight}>
          <Text style={styles.highlightTitle}>IMPORTANTE — EMISSÃO DE NOTA FISCAL</Text>
          <Text style={styles.highlightText}>
            O vend.ai e a Wolf Hub NÃO se responsabilizam pela emissão de notas fiscais
            referentes às vendas realizadas pelo CONTRATANTE através da plataforma.
            A emissão de nota fiscal é obrigação exclusiva do CONTRATANTE, conforme
            legislação tributária vigente.
          </Text>
          <Text style={styles.highlightText}>
            A Wolf Hub emite nota fiscal apenas referente à assinatura mensal da
            plataforma (serviço de licença de software — CNAE 62.03-1-00).
          </Text>
          <Text style={styles.highlightText}>
            Integração com sistemas emissores de nota fiscal poderá ser disponibilizada
            futuramente mediante custo adicional a ser comunicado com antecedência.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Responsabilidades</Text>
          <Text style={styles.text}>
            São responsabilidades da CONTRATADA: disponibilidade da plataforma,
            segurança dos dados conforme LGPD, suporte técnico e atualizações do sistema.
          </Text>
          <Text style={styles.text}>
            São responsabilidades do CONTRATANTE: conteúdo publicado na loja,
            veracidade dos produtos e preços, atendimento aos clientes finais,
            cumprimento das obrigações fiscais e tributárias, e conformidade com
            o Código de Defesa do Consumidor.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Proteção de Dados (LGPD)</Text>
          <Text style={styles.text}>
            O tratamento de dados pessoais obedece à Lei 13.709/2018 (LGPD).
            Os dados coletados são utilizados exclusivamente para operação da
            plataforma. Consulte a Política de Privacidade em vendai.club/privacidade.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Foro e Legislação</Text>
          <Text style={styles.text}>
            Fica eleito o foro da Comarca de Curitiba/PR para dirimir quaisquer
            controvérsias oriundas deste contrato, com renúncia a qualquer outro,
            por mais privilegiado que seja. Aplica-se a legislação brasileira.
          </Text>
        </View>

        <View style={styles.signatureBox}>
          <Text style={styles.sectionTitle}>Registro de Aceite Digital</Text>
          <Text style={styles.signatureText}>
            Este contrato foi aceito eletronicamente pelo CONTRATANTE, tendo validade
            jurídica conforme MP 2.200-2/2001 e Lei 14.063/2020.
          </Text>
          <Text style={styles.signatureText}>Nome: {ownerName}</Text>
          <Text style={styles.signatureText}>E-mail: {email}</Text>
          <Text style={styles.signatureText}>Data e hora: {acceptedAt}</Text>
          <Text style={styles.signatureText}>IP de origem: {acceptedIp}</Text>
          <Text style={styles.signatureText}>Versão dos termos: {termsVersion}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {COMPANY.name} · CNPJ {COMPANY.cnpj}
          </Text>
          <Text style={styles.footerText}>vendai.club · {companyCityShort()}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateTermsPdf(props: TermsPdfProps): Promise<Buffer> {
  const buffer = await renderToBuffer(<TermsPdfDocument {...props} />)
  return Buffer.from(buffer)
}
