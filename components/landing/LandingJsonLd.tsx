import { SITE_DESCRIPTION, SITE_ENTITY, siteUrl } from '@/lib/site-seo'
import { COMPANY } from '@/lib/company'
import { BRAND, BRAND_LOGO } from '@/lib/brand'
import { LANDING_FAQ_ITEMS } from '@/lib/landing-faq'

/** Schema.org para buscadores e crawlers de IA. */
export default function LandingJsonLd() {
  const faqPage = {
    '@type':      'FAQPage',
    '@id':        `${siteUrl()}/#faq`,
    mainEntity:   LANDING_FAQ_ITEMS.map((item) => ({
      '@type':          'Question',
      name:             item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    item.a,
      },
    })),
  }

  const data = {
    '@context': 'https://schema.org',
    '@graph':   [
      {
        '@type':            'WebSite',
        '@id':              `${siteUrl()}/#website`,
        name:               SITE_ENTITY.productName,
        url:                siteUrl(),
        description:        SITE_DESCRIPTION,
        inLanguage:         'pt-BR',
        publisher:          { '@id': `${siteUrl()}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id':   `${siteUrl()}/#organization`,
        name:    COMPANY.name,
        url:     siteUrl(),
        logo:    siteUrl(BRAND_LOGO.wordmark),
        email:   SITE_ENTITY.supportEmail,
        address: {
          '@type':           'PostalAddress',
          addressLocality:   'Curitiba',
          addressRegion:     'PR',
          addressCountry:    'BR',
        },
      },
      {
        '@type':               'SoftwareApplication',
        '@id':                 `${siteUrl()}/#software`,
        name:                  SITE_ENTITY.productName,
        url:                   siteUrl(),
        applicationCategory:   'BusinessApplication',
        operatingSystem:       'Web',
        description:           SITE_DESCRIPTION,
        inLanguage:            'pt-BR',
        offers: {
          '@type':         'Offer',
          price:           '0',
          priceCurrency:   'BRL',
          description:     'Plano Grátis disponível',
          url:             siteUrl('/cadastro'),
        },
        provider: { '@id': `${siteUrl()}/#organization` },
        featureList: [
          'Vitrine online para moda',
          'Assistente com IA (Vi)',
          'Pedidos via WhatsApp',
          'Controle de estoque por SKU',
          'Alertas de estoque no painel',
        ],
      },
      faqPage,
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
