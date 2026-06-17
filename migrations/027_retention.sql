-- Migration 027: fluxo de retenção no cancelamento (+30 dias via superadmin)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS retention_offer_clicked_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS retention_bonus_granted_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS retention_bonus_dismissed_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS retention_bonus_granted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_stores_retention_pending
  ON stores (retention_offer_clicked_at DESC)
  WHERE retention_offer_clicked_at IS NOT NULL
    AND retention_bonus_granted_at IS NULL
    AND retention_bonus_dismissed_at IS NULL;
