ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT
    NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual'));
