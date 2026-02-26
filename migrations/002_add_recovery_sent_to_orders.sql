-- Marca quando o lojista enviou mensagem de recuperação pelo WhatsApp
-- Pedidos para recuperar: status = 'NOVO', created_at < NOW() - 24h, recovery_sent_at IS NULL
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovery_sent_at TIMESTAMPTZ NULL;
