/**
 * Em produção, evita vazar stack traces e detalhes internos do objeto `Error` nos logs.
 */
export function logServerError(scope: string, error: unknown): void {
  if (process.env.NODE_ENV === 'production') {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(scope, msg)
  } else {
    console.error(scope, error)
  }
}
