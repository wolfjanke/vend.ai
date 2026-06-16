'use client'

import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import type { PaymentLink } from '@/types'
import { activePaymentLinks } from '@/lib/payment-links'

interface Props {
  pixKey?:        string
  paymentLinks?:  PaymentLink[]
  className?:     string
}

export default function PaymentOptionsPanel({ pixKey, paymentLinks, className = '' }: Props) {
  const [copied, setCopied] = useState(false)
  const key = pixKey?.trim()
  const links = activePaymentLinks(paymentLinks)

  if (!key && links.length === 0) return null

  async function copyPix() {
    if (!key) return
    try {
      await navigator.clipboard.writeText(key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const inp = document.createElement('input')
      inp.value = key
      document.body.appendChild(inp)
      inp.select()
      document.execCommand('copy')
      document.body.removeChild(inp)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={`rounded-xl border border-border bg-surface2 p-3 space-y-3 min-w-0 ${className}`}>
      {key && (
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">Chave PIX da loja</p>
          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            <p className="flex-1 min-w-0 text-sm font-mono break-all text-foreground px-3 py-2.5 bg-surface border border-border rounded-xl">
              {key}
            </p>
            <button
              type="button"
              onClick={() => void copyPix()}
              className="shrink-0 min-h-[44px] px-4 py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
            >
              <Copy size={16} aria-hidden />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
            {key ? 'Ou pague por' : 'Pague por'}
          </p>
          <div className="flex flex-col gap-2">
            {links.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors inline-flex items-center justify-center gap-2 break-words"
              >
                <ExternalLink size={16} className="shrink-0" aria-hidden />
                <span className="truncate">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
