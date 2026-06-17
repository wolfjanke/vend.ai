'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, Circle, ExternalLink, Sparkles } from 'lucide-react'
import {
  PRODUCT_READINESS_ISSUE_LABELS,
  viReadinessLevelLabel,
  type ViReadinessLevel,
  type ViReadinessReport,
} from '@/lib/vi-readiness'

const VI_TESTED_KEY = 'vend_vi_tested'
const LINK_COPIED_KEY = 'vend_onboarding_link_copied'

type Props = {
  report:    ViReadinessReport
  storeUrl:  string
  hasLogo:   boolean
}

const LEVEL_STYLES: Record<ViReadinessLevel, string> = {
  ready:      'text-accent border-accent/40 bg-accent/10',
  almost:     'text-primary border-primary/40 bg-primary/10',
  incomplete: 'text-warm border-warm/40 bg-warm/10',
}

export default function ViReadinessCard({ report, storeUrl, hasLogo }: Props) {
  const [viTested, setViTested] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(VI_TESTED_KEY) === '1') setViTested(true)
      if (localStorage.getItem(LINK_COPIED_KEY) === '1') setLinkCopied(true)
    } catch {
      /* ignore */
    }
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(storeUrl)
      localStorage.setItem(LINK_COPIED_KEY, '1')
      setLinkCopied(true)
    } catch {
      /* ignore */
    }
  }

  function markViTested() {
    try {
      localStorage.setItem(VI_TESTED_KEY, '1')
    } catch {
      /* ignore */
    }
    setViTested(true)
  }

  const actionSteps = [
    {
      done: viTested,
      label: 'Testar a Vi na sua loja',
      action: (
        <Link
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={markViTested}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline min-h-[44px]"
        >
          Abrir loja e falar com a Vi
          <ExternalLink size={12} aria-hidden />
        </Link>
      ),
    },
    {
      done: linkCopied,
      label: 'Copiar o link e compartilhar no Instagram',
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
    {
      done: hasLogo,
      label: 'Adicionar logo da loja (opcional)',
      action: !hasLogo ? (
        <Link
          href="/admin/configuracoes"
          className="mt-2 inline-block text-xs text-primary font-semibold hover:underline min-h-[44px]"
        >
          Ir em Configurações
        </Link>
      ) : undefined,
    },
  ]

  const showCard = report.level !== 'ready' || !viTested || !linkCopied

  if (!showCard) return null

  return (
    <div className="mb-8 p-4 sm:p-5 rounded-2xl border border-primary/25 bg-primary/5 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-primary shrink-0" aria-hidden />
            <p className="font-syne font-bold text-sm text-foreground">Sua Vi está pronta?</p>
          </div>
          <p className="text-xs text-muted break-words leading-relaxed">
            A Vi só responde bem quando o catálogo tem foto, preço e estoque. Complete os passos abaixo para não perder vendas no Direct.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${LEVEL_STYLES[report.level]}`}>
            {viReadinessLevelLabel(report.level)}
          </span>
          <span className="text-xs text-muted tabular-nums">{report.percent}%</span>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-surface2 overflow-hidden mb-4" aria-hidden>
        <div
          className="h-full bg-grad transition-all duration-500"
          style={{ width: `${Math.min(100, report.percent)}%` }}
        />
      </div>

      <ul className="space-y-3 mb-4">
        {report.steps.map(step => (
          <li key={step.id} className="flex gap-3 text-sm text-muted min-w-0">
            <span className="shrink-0 mt-0.5" aria-hidden>
              {step.done ? <Check size={18} className="text-accent" /> : <Circle size={18} className="text-border" />}
            </span>
            <div className="min-w-0">
              <span className={step.done ? 'line-through opacity-70' : ''}>{step.label}</span>
              {step.hint && !step.done && (
                <p className="text-[11px] text-warm mt-0.5 break-words">{step.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {report.incompleteProducts.length > 0 && (
        <div className="mb-4 p-3 rounded-xl border border-border bg-surface/60 min-w-0">
          <p className="text-xs font-semibold text-foreground mb-2">Corrigir produtos</p>
          <ul className="space-y-2">
            {report.incompleteProducts.slice(0, 5).map(p => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-xs min-w-0">
                <span className="text-muted truncate min-w-0 flex-1" title={p.name}>{p.name}</span>
                <span className="text-warm shrink-0">
                  {p.issues.map(i => PRODUCT_READINESS_ISSUE_LABELS[i]).join(', ')}
                </span>
                <Link
                  href={`/admin/produtos/${p.id}`}
                  className="text-primary font-semibold hover:underline min-h-[44px] inline-flex items-center shrink-0"
                >
                  Editar
                </Link>
              </li>
            ))}
          </ul>
          {report.incompleteProducts.length > 5 && (
            <Link
              href="/admin/produtos"
              className="mt-2 inline-block text-xs text-primary font-semibold hover:underline min-h-[44px]"
            >
              Ver todos os produtos
            </Link>
          )}
          {report.activeProductCount < report.minProducts && (
            <Link
              href="/admin/produtos/novo"
              className="mt-2 inline-flex items-center text-xs text-primary font-semibold hover:underline min-h-[44px]"
            >
              Cadastrar outro produto →
            </Link>
          )}
        </div>
      )}

      <ul className="space-y-3 pt-3 border-t border-border/60">
        {actionSteps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-muted min-w-0">
            <span className="shrink-0 mt-0.5" aria-hidden>
              {step.done ? <Check size={18} className="text-accent" /> : <Circle size={18} className="text-border" />}
            </span>
            <div className="min-w-0">
              <span className={step.done ? 'line-through opacity-70' : ''}>{step.label}</span>
              {step.action}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
