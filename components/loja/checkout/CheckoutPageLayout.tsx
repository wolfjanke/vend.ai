import Image from 'next/image'

interface Props {
  storeName: string
  storeLogo?: string | null
  storeSlug: string
  children:  React.ReactNode
}

export default function CheckoutPageLayout({ storeName, storeLogo, storeSlug, children }: Props) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-6xl mx-auto h-14 flex items-center justify-between px-4 gap-3">
          <a
            href={`/${storeSlug}`}
            className="flex items-center gap-2 min-w-0 text-muted text-sm hover:text-foreground transition-colors"
          >
            {storeLogo ? (
              <Image
                src={storeLogo}
                alt={storeName}
                width={32}
                height={32}
                className="rounded-lg object-cover shrink-0"
              />
            ) : (
              <span className="w-8 h-8 rounded-lg bg-surface2 border border-border shrink-0 flex items-center justify-center text-xs font-bold">
                {storeName.charAt(0)}
              </span>
            )}
            <span className="truncate font-semibold text-foreground">{storeName}</span>
          </a>
          <span className="text-xs text-muted shrink-0 flex items-center gap-1">
            Checkout seguro
            <span aria-hidden>🔒</span>
          </span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 pb-24">
        {children}
      </main>
    </div>
  )
}
