# Migrations vend.ai (Neon)

Execute na ordem: 001, 002 e 003.

## Com psql

```bash
# Usando a connection string do Neon (variável DATABASE_URL no .env.local)
psql "$DATABASE_URL" -f migrations/001_add_plan_to_stores.sql
psql "$DATABASE_URL" -f migrations/002_add_recovery_sent_to_orders.sql
psql "$DATABASE_URL" -f migrations/003_add_order_pricing_fields.sql
```

No Windows (PowerShell):

```powershell
$env:DATABASE_URL = (Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' }) -replace 'DATABASE_URL=', ''
psql $env:DATABASE_URL -f migrations/001_add_plan_to_stores.sql
psql $env:DATABASE_URL -f migrations/002_add_recovery_sent_to_orders.sql
psql $env:DATABASE_URL -f migrations/003_add_order_pricing_fields.sql
```

## Neon SQL Editor

No dashboard do Neon, abra o SQL Editor e cole o conteúdo de cada arquivo, executando `001_add_plan_to_stores.sql`, depois `002_add_recovery_sent_to_orders.sql` e por fim `003_add_order_pricing_fields.sql`.

## Conteúdo

- **001:** Adiciona coluna `plan` em `stores` (valores: free, starter, pro, loja). Default: `free`.
- **002:** Adiciona coluna `recovery_sent_at` em `orders` (timestamp ou null) para marcar envio de mensagem de recuperação.
- **003:** Adiciona colunas de precificação final em `orders` (`subtotal`, descontos, `total_final`, `payment_method`, `coupon_code_applied`).
