import { sql } from '@/lib/db'
import {
  getUserSessionVersion,
  isTokenSessionVersionStale,
} from '@/lib/session-version'

/** Compara `password_changed_at` com `iat` do JWT (segundos). */
export function isPasswordChangeAfterTokenIssued(
  passwordChangedAt: string | Date | null | undefined,
  tokenIatSeconds: number | undefined,
): boolean {
  if (!passwordChangedAt || tokenIatSeconds == null) return false
  const changedMs = new Date(passwordChangedAt).getTime()
  const issuedMs = tokenIatSeconds * 1000
  return changedMs > issuedMs
}

export type SessionTokenClaims = {
  sub?: string
  iat?: number
  exp?: number
  sessionRevoked?: boolean
  sessionVer?: number
}

export function isJwtExpired(exp: number | undefined): boolean {
  return exp != null && exp * 1000 < Date.now()
}

/** Sessão invalidada após troca/redefinição de senha (consulta DB). */
export async function isSessionRevokedByPasswordChange(
  userId: string,
  tokenIatSeconds: number | undefined,
): Promise<boolean> {
  if (!userId || tokenIatSeconds == null) return false

  try {
    const rows = await sql`
      SELECT password_changed_at FROM admin_users WHERE id = ${userId} LIMIT 1
    `
    const changedAt = rows[0]?.password_changed_at as string | Date | null | undefined
    return isPasswordChangeAfterTokenIssued(changedAt, tokenIatSeconds)
  } catch (e) {
    console.error('[session-revocation] password_changed_at:', e)
    return false
  }
}

/** Sessão invalidada por logout ou rotação de versão. */
export async function isSessionRevokedByVersion(
  userId: string,
  tokenSessionVer: number | undefined,
): Promise<boolean> {
  if (!userId) return false
  const current = await getUserSessionVersion(userId)
  return isTokenSessionVersionStale(tokenSessionVer, current)
}

/** Token JWT revogado (flag, senha alterada ou versão de sessão). */
export async function isAuthTokenRevoked(
  token: SessionTokenClaims | null,
): Promise<boolean> {
  if (!token?.sub) return false
  if (token.sessionRevoked === true) return true

  if (await isSessionRevokedByVersion(token.sub, token.sessionVer)) return true

  return isSessionRevokedByPasswordChange(token.sub, token.iat)
}
