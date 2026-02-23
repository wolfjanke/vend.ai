import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'
import Providers from './Providers'

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
  title:       'vend.ai — Moda com IA',
  description: 'Catálogo digital com IA integrada para lojas de moda feminina. Pedidos direto no WhatsApp.',
  keywords:    ['loja online', 'moda feminina', 'IA', 'WhatsApp', 'catálogo digital'],
  openGraph: {
    title:       'vend.ai — Moda com IA',
    description: 'Catálogo inteligente + assistente IA + pedidos no WhatsApp',
    type:        'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
