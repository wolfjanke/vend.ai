/** Pictográficos, símbolos decorativos e modificadores comuns em emoji. */
const EMOJI_PATTERN =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu

/** Remove emojis preservando o restante do texto. */
export function stripEmojis(input: string): string {
  return String(input ?? '').replace(EMOJI_PATTERN, '')
}

/** Texto seguro para exibição na vitrine (remove emoji nas bordas). */
export function vitrineText(input: string | null | undefined): string {
  return stripEmojis(String(input ?? '')).replace(/\s+/g, ' ').trim()
}
