ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS checkout_mode TEXT
    NOT NULL DEFAULT 'whatsapp_only'
    CHECK (checkout_mode IN (
      'whatsapp_only',
      'whatsapp_and_checkout',
      'checkout_only'
    ));
