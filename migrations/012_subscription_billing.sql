-- Migration 012: assinaturas recorrentes e billing do lojista
ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_billing_customer_id TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
