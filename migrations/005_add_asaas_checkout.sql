-- Migration 005: Asaas checkout integration
-- stores: campos de subconta Asaas
ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_account_id       VARCHAR(64);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_wallet_id        VARCHAR(64);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_api_key_enc      TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_onboarding_status VARCHAR(32) DEFAULT 'PENDING';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_onboarding_url   TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_approved_at      TIMESTAMPTZ;

-- orders: campos de pagamento integrado (separado de status logístico)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_source          VARCHAR(16);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS asaas_payment_id        VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS asaas_installment_id    VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_gross_value    DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_installment_count INT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_installment_value DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_pct        DECIMAL(5,4);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_amount     DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS asaas_split_status      VARCHAR(32);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status          VARCHAR(32);

-- Deduplicação de eventos webhook Asaas
CREATE TABLE IF NOT EXISTS webhook_events_asaas (
  id           SERIAL PRIMARY KEY,
  event_id     VARCHAR(128) UNIQUE NOT NULL,
  event_type   VARCHAR(64),
  payload      JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
