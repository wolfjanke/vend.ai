# Retenção de dados — clientes finais

- **Prazo padrão:** 24 meses após o último pedido do titular (WhatsApp normalizado).
- **Anonimização:** `customer_name` → "Titular removido (LGPD)", `customer_whatsapp` → `***`, endereço, e-mail e CPF removidos.
- **Job automático:** Vercel Cron semanal chama `GET /api/cron/lgpd-retention` (requer `CRON_SECRET` no ambiente).

Configure em Vercel:

```bash
CRON_SECRET=<token-aleatório-longo>
```

O cron envia `Authorization: Bearer <CRON_SECRET>`.

Implementação: `lib/lgpd.ts` → `anonymizeStaleCustomerData()`.
