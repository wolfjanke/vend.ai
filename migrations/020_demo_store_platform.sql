-- Urban Mix: loja de demonstração da plataforma (não é cliente pagante).
UPDATE stores SET
  is_demo = true,
  plan = 'enterprise',
  subscription_status = NULL,
  asaas_subscription_id = NULL,
  subscription_started_at = NULL,
  subscription_ends_at = NULL,
  trial_ends_at = NULL
WHERE slug = 'urban-mix';
