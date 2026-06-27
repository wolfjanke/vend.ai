/** URL com token sensível no fragmento (#), não enviado ao servidor na navegação inicial. */
export function buildTokenFragmentUrl(baseUrl: string, pathname: string, token: string): string {
  const base = baseUrl.replace(/\/$/, '')
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${path}#token=${encodeURIComponent(token)}`
}

export function buildPasswordResetPageUrl(baseUrl: string, token: string): string {
  return buildTokenFragmentUrl(baseUrl, '/redefinir-senha', token)
}

export function buildEmailVerifyPageUrl(baseUrl: string, token: string): string {
  return buildTokenFragmentUrl(baseUrl, '/verificar-email', token)
}

/** Lê token do hash (#token=) ou query legada (?token=) no browser. */
export function readAuthTokenFromBrowserUrl(): string {
  if (typeof window === 'undefined') return ''

  const hash = window.location.hash
  if (hash.startsWith('#token=')) {
    return decodeURIComponent(hash.slice('#token='.length))
  }

  return new URLSearchParams(window.location.search).get('token') ?? ''
}

/** Remove token da barra de endereço após leitura no client. */
export function clearAuthTokenFromBrowserUrl(): void {
  if (typeof window === 'undefined') return
  window.history.replaceState(null, '', window.location.pathname)
}
