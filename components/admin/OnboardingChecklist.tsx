'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Check, Circle } from 'lucide-react'

const STORAGE_KEY = 'vend_onboarding_link_copied'

interface Props {
  hasLogo: boolean
  hasProducts: boolean
  storeUrl: string
}

export default function OnboardingChecklist({ hasLogo, hasProducts, storeUrl }: Props) {
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1') {
        setLinkCopied(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(storeUrl)
      localStorage.setItem(STORAGE_KEY, '1')
      setLinkCopied(true)
    } catch {
      /* ignore */
    }
  }

  const steps: Array<{
    done: boolean
    label: string
    action?: ReactNode
  }> = [
    { done: hasLogo, label: 'Adicionar logo da loja em Configurações' },
    { done: hasProducts, label: 'Cadastrar pelo menos um produto' },
    {
      done: linkCopied,
      label: 'Copiar o link da loja e compartilhar',
      action: (
        <button
          type="button"
          onClick={() => void copyLink()}
          className="mt-2 text-xs text-primary font-semibold hover:underline min-h-[44px]"
        >
          Copiar link da loja
        </button>
      ),
    },
  ]

  return (
    <div className="mb-8 p-4 rounded-2xl border border-primary/25 bg-primary/5">
      <p className="font-syne font-bold text-sm text-foreground mb-3">Primeiros passos</p>
      <ul className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm text-muted">
            <span className="shrink-0 mt-0.5" aria-hidden>
              {s.done ? <Check size={18} className="text-accent" /> : <Circle size={18} className="text-border" />}
            </span>
            <div className="min-w-0">
              <span className={s.done ? 'line-through opacity-70' : ''}>{s.label}</span>
              {s.action}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
