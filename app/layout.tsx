import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'
import { BRAND } from '@/lib/brand'
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_TITLE, siteUrl } from '@/lib/site-seo'

const syne = Syne({
  subsets:  ['latin'],
  variable: '--font-syne',
  weight:   ['400', '500', '600', '700', '800'],
  display:  'swap',
})

const dmSans = DM_Sans({
  subsets:  ['latin'],
  variable: '--font-dm-sans',
  weight:   ['300', '400', '500', '600'],
  display:  'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_TITLE,
    template: `%s | ${BRAND.displayName}`,
  },
  description: SITE_DESCRIPTION,
  keywords:    [...SITE_KEYWORDS],
  icons: {
    icon:   { url: BRAND.favicon, type: 'image/svg+xml' },
    apple:  { url: BRAND.appleTouch, type: 'image/svg+xml' },
    shortcut: BRAND.favicon,
  },
  alternates:  { canonical: siteUrl() },
  openGraph: {
    title:       SITE_TITLE,
    description: SITE_DESCRIPTION,
    type:        'website',
    url:         siteUrl(),
    locale:      'pt_BR',
    siteName:    BRAND.displayName,
    images:      [{ url: BRAND.ogImage, width: 1200, height: 630, alt: BRAND.alt, type: 'image/svg+xml' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       SITE_TITLE,
    description: SITE_DESCRIPTION,
    images:      [BRAND.ogImage],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export const viewport = {
  width:        'device-width',
  initialScale: 1,
  viewportFit:  'cover' as const,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
