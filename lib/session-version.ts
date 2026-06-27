import { sql } from '@/lib/db'

const DEFAULT_VERSION = 1

export { DEFAULT_VERSION as DEFAULT_SESSION_VERSION }

/** JWT legado sem claim sessionVer é tratado como versão inicial. */
export function normalizeTokenSessionVersion(tokenVer: number | undefined): number {
  if (tokenVer == null || !Number.isFinite(tokenVer)) return DEFAULT_VERSION
  return tokenVer >= 1 ? tokenVer : DEFAULT_VERSION
}

/** Versão atual de sessão do usuário (incrementada no logout e troca de senha). */
export async function getUserSessionVersion(userId: string): Promise<number> {
  try {
    const rows = await sql`
      SELECT session_version FROM admin_users WHERE id = ${userId} LIMIT 1
    `
    const raw = rows[0]?.session_version as number | string | null | undefined
    const n = Number(raw)
    return Number.isFinite(n) && n >= 1 ? n : DEFAULT_VERSION
  } catch (e) {
    console.error('[session-version] getUserSessionVersion:', e)
    return DEFAULT_VERSION
  }
}

/** Invalida todos os JWTs emitidos antes deste incremento. */
export async function bumpSessionVersion(userId: string): Promise<void> {
  try {
    await sql`
      UPDATE admin_users
      SET session_version = COALESCE(session_version, 1) + 1
      WHERE id = ${userId}
    `
  } catch (e) {
    console.error('[session-version] bumpSessionVersion:', e)
  }
}

/** Compara versão embutida no JWT com a versão atual no banco. */
export function isTokenSessionVersionStale(
  tokenVer: number | undefined,
  currentVer: number,
): boolean {
  return normalizeTokenSessionVersion(tokenVer) < currentVer
}
