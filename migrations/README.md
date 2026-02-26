# Migrations vend.ai (Neon)

Execute na ordem: 001 depois 002.

## Com psql

```bash
# Usando a connection string do Neon (variável DATABASE_URL no .env.local)
psql "$DATABASE_URL" -f migrations/001_add_plan_to_stores.sql
psql "$DATABASE_URL" -f migrations/002_add_recovery_sent_to_orders.sql
```

No Windows (PowerShell):

```powershell
$env:DATABASE_URL = (Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' }) -replace 'DATABASE_URL=', ''
psql $env:DATABASE_URL -f migrations/001_add_plan_to_stores.sql
psql $env:DATABASE_URL -f migrations/002_add_recovery_sent_to_orders.sql
```

## Neon SQL Editor

No dashboard do Neon, abra o SQL Editor e cole o conteúdo de cada arquivo, executando primeiro `001_add_plan_to_stores.sql` e em seguida `002_add_recovery_sent_to_orders.sql`.

## Conteúdo

- **001:** Adiciona coluna `plan` em `stores` (valores: free, starter, pro, loja). Default: `free`.
- **002:** Adiciona coluna `recovery_sent_at` em `orders` (timestamp ou null) para marcar envio de mensagem de recuperação.
