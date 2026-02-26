-- Planos: free (10 prod), starter (25), pro (50), loja (ilimitado)
-- Lojas existentes ficam com plan = 'free'
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

DO $$
BEGIN
  ALTER TABLE stores ADD CONSTRAINT stores_plan_check CHECK (plan IN ('free','starter','pro','loja'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
