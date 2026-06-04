'use client'

interface Props {
  href: string
}

/** Carrega Google Fonts sem bloquear a primeira pintura (rede lenta / mobile). */
export default function NonBlockingFontLink({ href }: Props) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href={href}
        media="print"
        onLoad={e => {
          const el = e.currentTarget
          el.media = 'all'
        }}
      />
      <noscript>
        <link rel="stylesheet" href={href} />
      </noscript>
    </>
  )
}
