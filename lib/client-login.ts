/** Login via API (rate limit + cookie de sessão). */
export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<
  | { ok: true }
  | { ok: false; error: string; rateLimited?: boolean; emailNotVerified?: boolean }
> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string }

  if (res.status === 429) {
    return {
      ok: false,
      rateLimited: true,
      error: data.error ?? 'Muitas tentativas. Aguarde alguns minutos.',
    }
  }

  if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
    return {
      ok: false,
      emailNotVerified: true,
      error: data.error ?? 'Confirme seu e-mail antes de entrar.',
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      error: data.error ?? 'E-mail ou senha inválidos.',
    }
  }

  return { ok: true }
}
