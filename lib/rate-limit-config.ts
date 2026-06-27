/** Janelas de tempo reutilizadas nos rate limits. */
export const MS = {
  MINUTE:          60_000,
  FIFTEEN_MINUTES: 15 * 60_000,
  HOUR:            3_600_000,
} as const

// ─── Auth ───────────────────────────────────────────────────────────────────

export const LOGIN_IP_LIMIT = 10
export const LOGIN_EMAIL_LIMIT = 5
export const LOGIN_WINDOW_MS = MS.FIFTEEN_MINUTES

export const RESET_PASSWORD_IP_LIMIT = 5
export const RESET_PASSWORD_WINDOW_MS = MS.HOUR

export const FORGOT_PASSWORD_IP_LIMIT = 3
export const FORGOT_PASSWORD_EMAIL_LIMIT = 3
export const FORGOT_PASSWORD_WINDOW_MS = MS.HOUR

export const RESEND_VERIFY_IP_LIMIT = 3
export const RESEND_VERIFY_EMAIL_LIMIT = 3
export const RESEND_VERIFY_WINDOW_MS = MS.HOUR

export const CHANGE_PASSWORD_LIMIT = 5
export const CHANGE_PASSWORD_WINDOW_MS = MS.FIFTEEN_MINUTES

export const VERIFY_EMAIL_IP_LIMIT = 20
export const VERIFY_EMAIL_WINDOW_MS = MS.HOUR

export const REGISTER_IP_LIMIT = 5
export const REGISTER_EMAIL_LIMIT = 3
export const REGISTER_WINDOW_MS = MS.HOUR

export const COMPLETE_SIGNUP_IP_LIMIT = 5
export const COMPLETE_SIGNUP_WINDOW_MS = MS.HOUR

// ─── Billing / pagamentos (admin) ───────────────────────────────────────────

export const SUBSCRIPTION_POST_LIMIT = 3
export const SUBSCRIPTION_POST_WINDOW_MS = MS.HOUR

export const PDV_LINK_POST_LIMIT = 20
export const PDV_LINK_POST_WINDOW_MS = MS.HOUR

export const SUBACCOUNT_POST_LIMIT = 3
export const SUBACCOUNT_POST_WINDOW_MS = MS.HOUR

// ─── Loja (admin) ───────────────────────────────────────────────────────────

export const UPLOAD_POST_LIMIT = 30
export const UPLOAD_POST_WINDOW_MS = MS.HOUR

export const LGPD_ADMIN_ANON_LIMIT = 10
export const LGPD_ADMIN_ANON_WINDOW_MS = MS.HOUR

export const PHOTO_ANALYZE_BURST_LIMIT = 10
export const PHOTO_ANALYZE_BURST_WINDOW_MS = MS.HOUR

// ─── Público / vitrine ──────────────────────────────────────────────────────

export const CHECKOUT_STATUS_LIMIT = 60
export const CHECKOUT_STATUS_WINDOW_MS = MS.MINUTE

export const CHECKOUT_CREATE_IP_LIMIT = 5
export const CHECKOUT_CREATE_IP_WINDOW_MS = MS.MINUTE

export const CHECKOUT_CREATE_STORE_LIMIT = 30
export const CHECKOUT_CREATE_STORE_WINDOW_MS = MS.HOUR

export const LOJA_GET_IP_LIMIT = 60
export const LOJA_GET_IP_WINDOW_MS = MS.MINUTE

// ─── Rotas legadas (já existiam antes do plano) ─────────────────────────────

export const PEDIDOS_IP_LIMIT = 10
export const PEDIDOS_IP_WINDOW_MS = MS.MINUTE
export const PEDIDOS_STORE_LIMIT = 30
export const PEDIDOS_STORE_WINDOW_MS = MS.MINUTE

export const LGPD_PUBLIC_EXCLUSAO_IP_LIMIT = 3
export const LGPD_PUBLIC_EXCLUSAO_WINDOW_MS = MS.HOUR

export const VI_IP_LIMIT = 30
export const VI_IP_WINDOW_MS = MS.MINUTE

export const CEP_IP_LIMIT = 30
export const CEP_IP_WINDOW_MS = MS.MINUTE

export const CNPJ_IP_LIMIT = 30
export const CNPJ_IP_WINDOW_MS = MS.MINUTE

export const THEME_ANALYZE_STORE_LIMIT = 5
export const THEME_ANALYZE_STORE_WINDOW_MS = MS.HOUR

export const BANNER_TEXT_STORE_LIMIT = 10
export const BANNER_TEXT_STORE_WINDOW_MS = MS.HOUR
