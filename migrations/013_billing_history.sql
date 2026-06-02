-- Migration 013: histórico de cobranças (assinatura + excedente Vi)
CREATE TABLE IF NOT EXISTS billing_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  type         VARCHAR(32) NOT NULL,
  plan         VARCHAR(32),
  amount_cents INT NOT NULL,
  asaas_payment_id VARCHAR(64),
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_history_store ON billing_history(store_id, created_at DESC);
