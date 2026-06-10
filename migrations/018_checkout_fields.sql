-- Campos adicionais para checkout integrado Asaas

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_cpf_enc TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS net_value DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_qr_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_copy_paste TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_fixed DECIMAL(10,2) DEFAULT 0.99;

-- Atualizar take rates e taxa fixa no global_config
INSERT INTO global_config (key, value) VALUES
  ('fixed_transaction_fee', '0.99'::jsonb),
  ('take_rates', '{"free":3.9,"starter":3.5,"pro":2.75,"loja":1.7,"enterprise":1.5}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
