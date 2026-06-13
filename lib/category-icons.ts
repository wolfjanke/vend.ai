/** Emoji por slug — destaque visual nos chips da vitrine (mobile-first). */
const EMOJI_MAP: Record<string, string> = {
  '':       '✨',
  vestido:  '👗',
  blusa:    '👚',
  camiseta: '👕',
  calca:    '👖',
  bermuda:  '🩳',
  shorts:   '🩳',
  conjunto: '✨',
  saia:     '🩱',
  moletom:  '🧥',
  casaco:   '🧥',
  infantil: '👶',
  outro:    '🏷️',
  sale:     '🔥',
}

const KEYWORD_EMOJI: Array<[RegExp, string]> = [
  [/plus/i,              '➕'],
  [/top/i,               '👚'],
  [/macac/i,             '🩱'],
  [/conjunt/i,           '✨'],
  [/blus/i,              '👚'],
  [/vestid/i,            '👗'],
  [/camiset|camisa/i,    '👕'],
  [/body/i,              '👚'],
  [/legging/i,           '👖'],
  [/calç|calca|jeans/i,  '👖'],
  [/bermud|short/i,      '🩳'],
  [/jaquet|casac|molet/i,'🧥'],
  [/saia/i,              '🩱'],
  [/infant|kids|beb/i,   '👶'],
  [/promo|sale/i,        '🔥'],
]

/** Emoji da categoria; tenta slug, depois palavras-chave no rótulo customizado. */
export function getCategoryEmoji(slug: string, label?: string): string {
  const key = String(slug ?? '').trim()
  if (EMOJI_MAP[key]) return EMOJI_MAP[key]

  const hay = `${key} ${label ?? ''}`.toLowerCase()
  for (const [pattern, emoji] of KEYWORD_EMOJI) {
    if (pattern.test(hay)) return emoji
  }
  return '🏷️'
}
