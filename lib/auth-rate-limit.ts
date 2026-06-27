import {
  CHANGE_PASSWORD_LIMIT,
  CHANGE_PASSWORD_WINDOW_MS,
  COMPLETE_SIGNUP_IP_LIMIT,
  COMPLETE_SIGNUP_WINDOW_MS,
  FORGOT_PASSWORD_EMAIL_LIMIT,
  FORGOT_PASSWORD_IP_LIMIT,
  FORGOT_PASSWORD_WINDOW_MS,
  LOGIN_EMAIL_LIMIT,
  LOGIN_IP_LIMIT,
  LOGIN_WINDOW_MS,
  REGISTER_EMAIL_LIMIT,
  REGISTER_IP_LIMIT,
  REGISTER_WINDOW_MS,
  RESEND_VERIFY_EMAIL_LIMIT,
  RESEND_VERIFY_IP_LIMIT,
  RESEND_VERIFY_WINDOW_MS,
  RESET_PASSWORD_IP_LIMIT,
  RESET_PASSWORD_WINDOW_MS,
  VERIFY_EMAIL_IP_LIMIT,
  VERIFY_EMAIL_WINDOW_MS,
} from '@/lib/rate-limit-config'
import {
  checkEmailRateLimit,
  checkIpRateLimit,
  checkScopedRateLimit,
  checkUserRateLimit,
} from '@/lib/rate-limit-helpers'

export {
  CHANGE_PASSWORD_LIMIT,
  CHANGE_PASSWORD_WINDOW_MS,
  COMPLETE_SIGNUP_IP_LIMIT,
  COMPLETE_SIGNUP_WINDOW_MS,
  FORGOT_PASSWORD_EMAIL_LIMIT,
  FORGOT_PASSWORD_IP_LIMIT,
  FORGOT_PASSWORD_WINDOW_MS,
  LOGIN_EMAIL_LIMIT,
  LOGIN_IP_LIMIT,
  LOGIN_WINDOW_MS,
  REGISTER_EMAIL_LIMIT,
  REGISTER_IP_LIMIT,
  REGISTER_WINDOW_MS,
  RESEND_VERIFY_EMAIL_LIMIT,
  RESEND_VERIFY_IP_LIMIT,
  RESEND_VERIFY_WINDOW_MS,
  RESET_PASSWORD_IP_LIMIT,
  RESET_PASSWORD_WINDOW_MS,
  VERIFY_EMAIL_IP_LIMIT,
  VERIFY_EMAIL_WINDOW_MS,
} from '@/lib/rate-limit-config'

export async function checkLoginRateLimit(
  ip: string,
  email: string,
): Promise<boolean> {
  const ipOk = await checkIpRateLimit('auth:login', ip, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS)
  if (!ipOk) return false
  return checkEmailRateLimit('auth:login', email, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW_MS)
}

export async function checkResetPasswordRateLimit(ip: string): Promise<boolean> {
  return checkIpRateLimit('auth:reset', ip, RESET_PASSWORD_IP_LIMIT, RESET_PASSWORD_WINDOW_MS)
}

export async function checkForgotPasswordIpRateLimit(ip: string): Promise<boolean> {
  return checkIpRateLimit('auth:forgot', ip, FORGOT_PASSWORD_IP_LIMIT, FORGOT_PASSWORD_WINDOW_MS)
}

export async function checkForgotPasswordEmailRateLimit(email: string): Promise<boolean> {
  return checkEmailRateLimit(
    'auth:forgot',
    email,
    FORGOT_PASSWORD_EMAIL_LIMIT,
    FORGOT_PASSWORD_WINDOW_MS,
  )
}

export async function checkResendVerificationIpRateLimit(ip: string): Promise<boolean> {
  return checkIpRateLimit(
    'auth:resend-verify',
    ip,
    RESEND_VERIFY_IP_LIMIT,
    RESEND_VERIFY_WINDOW_MS,
  )
}

export async function checkResendVerificationEmailRateLimit(email: string): Promise<boolean> {
  return checkEmailRateLimit(
    'auth:resend-verify',
    email,
    RESEND_VERIFY_EMAIL_LIMIT,
    RESEND_VERIFY_WINDOW_MS,
  )
}

export async function checkChangePasswordRateLimit(userId: string): Promise<boolean> {
  return checkUserRateLimit(
    'auth:change-pwd',
    userId,
    CHANGE_PASSWORD_LIMIT,
    CHANGE_PASSWORD_WINDOW_MS,
  )
}

export async function checkVerifyEmailIpRateLimit(ip: string): Promise<boolean> {
  return checkIpRateLimit('auth:verify-email', ip, VERIFY_EMAIL_IP_LIMIT, VERIFY_EMAIL_WINDOW_MS)
}

export async function checkRegisterIpRateLimit(ip: string): Promise<boolean> {
  return checkIpRateLimit('auth:register', ip, REGISTER_IP_LIMIT, REGISTER_WINDOW_MS)
}

export async function checkRegisterEmailRateLimit(email: string): Promise<boolean> {
  return checkEmailRateLimit('auth:register', email, REGISTER_EMAIL_LIMIT, REGISTER_WINDOW_MS)
}

export async function checkCompleteSignupIpRateLimit(ip: string): Promise<boolean> {
  return checkScopedRateLimit(
    'auth:complete-signup',
    ip,
    COMPLETE_SIGNUP_IP_LIMIT,
    COMPLETE_SIGNUP_WINDOW_MS,
  )
}
