import Link from 'next/link'
import { Package } from 'lucide-react'
import type { LowStockSku } from '@/lib/stock-alerts'

interface Props {
  items: LowStockSku[]
  threshold: number
}

export default function LowStockPanel({ items, threshold }: Props) {
  if (items.length === 0) return null

  const preview = items.slice(0, 8)
  const extra = items.length - preview.length

  return (
    <div className="mb-8 bg-warm/5 border border-warm/30 rounded-2xl p-4 sm:p-5 min-w-0">
      <div className="flex items-start gap-3 mb-3">
        <Package size={20} className="text-warm shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <h2 className="font-syne font-bold text-base text-foreground">Estoque baixo</h2>
          <p className="text-xs text-muted break-words mt-0.5">
            {items.length} SKU{items.length === 1 ? '' : 's'} com ≤ {threshold} peça{threshold === 1 ? '' : 's'}.
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2 mb-3">
        {preview.map(item => (
          <li key={`${item.productId}-${item.variantId}-${item.skuKey}`} className="min-w-0">
            <Link
              href={`/admin/produtos/${item.productId}`}
              className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-sm hover:text-primary transition-colors min-h-[44px] py-2"
            >
              <span className="min-w-0 break-words">
                {item.productName}
                <span className="text-muted"> · {item.variantLabel} · {item.skuKey}</span>
              </span>
              <span className="text-warm font-bold tabular-nums shrink-0">{item.qty} un.</span>
            </Link>
          </li>
        ))}
      </ul>

      {extra > 0 && (
        <p className="text-xs text-muted mb-2">+ {extra} outro{extra === 1 ? '' : 's'} SKU{extra === 1 ? '' : 's'}</p>
      )}

      <Link
        href="/admin/produtos"
        className="text-xs text-primary hover:underline min-h-[44px] inline-flex items-center"
      >
        Ver todos os produtos →
      </Link>
    </div>
  )
}
