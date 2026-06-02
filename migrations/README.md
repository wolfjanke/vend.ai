# Migrations vend.ai (Neon)

Execute **na ordem numérica** (001 → 013). Todas usam `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` quando possível — reexecutar é seguro.

## Com psql

```bash
# Usando a connection string do Neon (variável DATABASE_URL no .env.local)
for f in migrations/00*.sql migrations/01*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

No Windows (PowerShell):

```powershell
$env:DATABASE_URL = (Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' }) -replace 'DATABASE_URL=', ''
Get-ChildItem migrations\*.sql | Sort-Object Name | ForEach-Object {
  psql $env:DATABASE_URL -f $_.FullName
}
```

## Neon SQL Editor

No dashboard do Neon, abra o SQL Editor e cole o conteúdo de cada arquivo **na ordem abaixo**, executando um de cada vez.

## Ordem e conteúdo

| Arquivo | O que faz |
|---------|-----------|
| **001** `add_plan_to_stores.sql` | Coluna `plan` em `stores` (free, starter, pro, loja) |
| **002** `add_recovery_sent_to_orders.sql` | Coluna `recovery_sent_at` em `orders` |
| **003** `add_order_pricing_fields.sql` | Colunas de precificação em `orders` (subtotal, descontos, cupom, etc.) |
| **005** `add_asaas_checkout.sql` | Integração Asaas: colunas em `stores`/`orders`, tabela `webhook_events_asaas`, `payment_source` |
| **006** `vi_usage.sql` | Tabela `vi_usage` (rate limit diário por loja) |
| **007** `store_vi_usage.sql` | Colunas `vi_messages_used`, `vi_overage_messages`, etc. em `stores`; plano `enterprise` |
| **008** `themes.sql` | Colunas de tema visual por loja (`theme_name`, cores, shimmer, etc.) |
| **009** `product_slug.sql` | Coluna `products.slug` + índice único por loja |
| **010** `assistant.sql` | Colunas `assistant_name`, `assistant_welcome_message`, `assistant_tone` |
| **011** `product_slug_backfill.sql` | Preenche `slug` vazio com `id` em produtos legados |
| **012** `subscription_billing.sql` | Assinaturas: `asaas_subscription_id`, `subscription_status`, `trial_ends_at`, etc. |
| **013** `billing_history.sql` | Histórico de cobranças (assinatura + excedente Vi) |

## Verificação pós-migration

```sql
SELECT column_name, table_name
FROM information_schema.columns
WHERE table_name IN ('stores', 'orders', 'products')
  AND column_name IN (
    'theme_name', 'payment_source', 'slug',
    'assistant_name', 'vi_messages_used',
    'asaas_account_id'
  )
ORDER BY table_name, column_name;
```

Deve retornar todas as colunas listadas.

## Setup local completo

Para ambiente novo (tabelas + seed demo):

```bash
node scripts/setup-db.mjs
```

O script inclui as alterações equivalentes às migrations 005–011.
