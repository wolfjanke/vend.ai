import { redirect }   from 'next/navigation'
import Link            from 'next/link'
import { getSession }  from '@/lib/auth'
import { sql }         from '@/lib/db'
import type { Product } from '@/types'
import { PRODUCT_CATEGORIES } from '@/types'
import ToggleActiveButton from './ToggleActiveButton'

export default async function ProdutosPage() {
  const session = await getSession()
  if (!session) redirect('/admin')

  const storeId = session.storeId

  const products = await sql`
    SELECT * FROM products WHERE store_id = ${storeId} ORDER BY created_at DESC
  `

  const getCategoryLabel = (val: string) =>
    PRODUCT_CATEGORIES.find(c => c.value === val)?.label ?? val

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-extrabold text-2xl mb-1">Produtos</h1>
          <p className="text-sm text-muted">
            {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary rounded-xl text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
        >
          + Novo produto
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(products as Product[]).map(p => (
            <div key={p.id} className="bg-surface border border-border rounded-2xl p-5 hover:border-border/60 transition-all group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface2 rounded-xl overflow-hidden flex items-center justify-center text-2xl">
                    {p.variants_json[0]?.photos[0]
                      ? <img src={p.variants_json[0].photos[0]} alt={p.name} className="w-full h-full object-cover" />
                      : '👗'}
                  </div>
                  <div>
                    <div className="font-syne font-semibold text-sm truncate max-w-[160px]">{p.name}</div>
                    <div className="text-xs text-muted">{getCategoryLabel(p.category)}</div>
                  </div>
                </div>
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${p.active ? 'bg-accent shadow-[0_0_6px_var(--accent-glow)]' : 'bg-muted'}`}
                  title={p.active ? 'Ativo' : 'Inativo'}
                />
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-accent font-bold text-base">
                  R${Number(p.price).toFixed(2).replace('.', ',')}
                </span>
                {p.promo_price && (
                  <span className="text-xs text-muted line-through">
                    R${Number(p.promo_price).toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              <div className="flex gap-1 flex-wrap mb-3">
                {p.variants_json.map((v: { id: string; color: string; colorHex: string }) => (
                  <span key={v.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-xs text-muted">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.colorHex }} />
                    {v.color}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/produtos/${p.id}`}
                  className="flex-1 text-center text-xs py-2 border border-border rounded-lg text-muted hover:border-primary hover:text-primary transition-all"
                >
                  Editar
                </Link>
                <ToggleActiveButton productId={p.id} active={p.active} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted">
          <div className="text-5xl mb-3">👗</div>
          <p className="font-medium">Nenhum produto ainda</p>
          <p className="text-sm mt-1 mb-6">Cadastre seu primeiro produto com ajuda da IA</p>
          <Link
            href="/admin/produtos/novo"
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-syne font-bold text-sm hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all"
          >
            📸 Cadastrar com IA
          </Link>
        </div>
      )}
    </div>
  )
}
