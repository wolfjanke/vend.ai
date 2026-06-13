-- Consentimento de privacidade registrado no pedido (LGPD)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS privacy_consent_at TIMESTAMPTZ;
