-- Uso mensal da Vi e análise de foto por loja
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS vi_messages_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vi_messages_reset_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS photo_analysis_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photo_analysis_reset_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS vi_daily_limit INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vi_overage_messages INTEGER DEFAULT 0;

ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_plan_check;

ALTER TABLE stores
  ADD CONSTRAINT stores_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'loja', 'enterprise'));
