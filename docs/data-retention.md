# Retenção de dados — clientes finais

- **Prazo padrão:** 24 meses após o último pedido do titular (WhatsApp normalizado).
- **Anonimização:** `customer_name` → "Titular removido (LGPD)", `customer_whatsapp` → `***`, endereço removido.
- **Job opcional:** agendar cron (ex. Vercel Cron) chamando lógica similar a `POST /api/admin/privacidade/excluir-cliente` para pedidos com `created_at` &lt; now() - interval '24 months'.

Implementação do job fica a critério do deploy; a política está documentada em `/privacidade`.
