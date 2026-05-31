-- Nome e tom da assistente por loja
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS assistant_name TEXT DEFAULT 'Vi',
  ADD COLUMN IF NOT EXISTS assistant_welcome_message TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS assistant_tone TEXT DEFAULT 'friendly'
    CHECK (assistant_tone IN ('friendly', 'formal', 'playful', 'professional'));
