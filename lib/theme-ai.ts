import { genAI, GEMINI_MODELS } from '@/lib/gemini'
import { expandHex } from '@/lib/theme-derive'
import { isValidHex } from '@/lib/theme-contrast'
import { defaultPageBgForTheme, inferThemeBackground } from '@/lib/theme-page-bg'
import { getTheme, type ThemeBackground, type ThemeName } from '@/lib/themes'
import { THEME_NAMES } from '@/lib/themes'

export type LogoBackgroundAnalysis = {
  color:                      string
  is_transparent:             boolean
  suggested_store_background: 'light' | 'dark'
  harmony_note:               string
}

export type ThemeAnalysisSuggestion = {
  themeName:   ThemeName
  label:       string
  reason:      string
  primary:     string
  secondary:   string
  accent:      string
  pageBg:      string
  /** Inferido de pageBg — mantido para compatibilidade. */
  background:  ThemeBackground
}

export type ThemeAnalysisResult = {
  suggestions:     ThemeAnalysisSuggestion[]
  summary:           string
  logo_background?: LogoBackgroundAnalysis
}

const DEFAULT_LOGO_BACKGROUND: LogoBackgroundAnalysis = {
  color:                      '#1A1A2E',
  is_transparent:             false,
  suggested_store_background: 'dark',
  harmony_note:               'Use o fundo escuro para destacar logos claras ou coloridas.',
}

function buildThemeAnalysisPrompt(input: {
  segment:      string
  audience:     string
  personality:  string
}): string {
  const themes = THEME_NAMES.join(', ')
  return `Você é um diretor de arte de e-commerce de moda no Brasil.
Analise o logo da loja e o contexto abaixo. Retorne APENAS JSON válido:

{
  "summary": "uma frase sobre a identidade visual detectada",
  "logo_background": {
    "color": "#RRGGBB",
    "is_transparent": true ou false,
    "suggested_store_background": "light ou dark",
    "harmony_note": "dica curta sobre harmonizar o fundo da vitrine com a logo (máx 160 caracteres)"
  },
  "suggestions": [
    {
      "themeName": "um destes: ${themes}",
      "label": "nome curto da sugestão",
      "reason": "por que combina (máx 120 caracteres)",
      "primary": "#RRGGBB",
      "secondary": "#RRGGBB",
      "accent": "#RRGGBB",
      "pageBg": "#RRGGBB",
      "background": "light ou dark (opcional — fallback se pageBg inválido)"
    }
  ]
}

Regras gerais:
- Exatamente 3 sugestões em "suggestions", themeName diferentes quando possível
- pageBg: hex do fundo da vitrine (cor sólida). Deve harmonizar com a logo e com o themeName escolhido
- Prefira pageBg escuro para logos claras/coloridas em temas premium; pageBg claro para logos escuras ou estilo editorial
- background (light/dark) só como dica legada — pageBg tem prioridade
- logo_background.color: cor dominante de fundo detectada na logo
- secondary pode repetir tom da primária com variação de luminosidade
- segmento: ${input.segment}
- público: ${input.audience}
- personalidade: ${input.personality}

Cores (obrigatório):
- A cor "primary" de cada sugestão DEVE ser derivada da cor principal da marca na logo (dourado, bronze, cobre, preto, etc.) — nunca invente uma cor que não exista visualmente na logo
- Antes de definir primary/secondary/accent, identifique as 2–3 cores mais visíveis na logo; use-as como base
- Se a cor sugerida não existir na logo, escolha a cor mais próxima que exista na logo
- accent e secondary devem harmonizar com primary extraída da logo

Estilo visual → tema (identifique pelo conjunto da logo, não só pelo segmento):
- Fundo escuro + cores quentes (dourado, bronze, cobre, âmbar) = luxo/premium → prefira themeName "lumiere" ou "boutique"; cores derivadas do dourado/bronze da logo
- Preto + dourado/âmbar = luxo elegante → "lumiere" com primary no tom dourado da logo
- Branco/claro + tons pastel ou delicados = delicado → "boutique"
- Cores vibrantes, neon ou muito saturadas = jovem/urbano → "pop", "street", "flash" ou "social"
- Grid denso / promoções / fast fashion → "flash"
- Visual Instagram / influencer → "social"
- Marketplace / volume / funcional → "fitness"
- Casual democrático / cores no card → "casual"
- Editorial minimalista preto e branco → "editorial"
- NUNCA sugira verde neon (#00FF87, #39FF14, etc.) nem amarelo vibrante/neon (#FFE500, #FFFF00) para logos com estilo premium, luxo, elegante ou sóbrio (preto + dourado/bronze)
- Para logos premium/luxo, evite themeName "fitness", "flash" e "pop" a menos que a logo tenha cores esportivas/neon/promocionais

Sem markdown.`
}

export async function analyzeLogoForTheme(
  logoBase64: string,
  mimeType: string,
  input: { segment: string; audience: string; personality: string },
): Promise<string> {
  const data = logoBase64.replace(/^data:image\/\w+;base64,/, '')
  const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.themeAnalysis })
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: mimeType || 'image/png', data } },
        { text: buildThemeAnalysisPrompt(input) },
      ],
    }],
  })
  return result.response.text?.() ?? ''
}

function normalizeLogoBackground(raw: unknown): LogoBackgroundAnalysis {
  if (!raw || typeof raw !== 'object') return DEFAULT_LOGO_BACKGROUND
  const o = raw as Record<string, unknown>
  const bg = o.suggested_store_background === 'light' ? 'light' : 'dark'
  const color = typeof o.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(o.color)
    ? o.color
    : DEFAULT_LOGO_BACKGROUND.color
  const note = typeof o.harmony_note === 'string' && o.harmony_note.trim()
    ? o.harmony_note.trim().slice(0, 160)
    : DEFAULT_LOGO_BACKGROUND.harmony_note
  return {
    color,
    is_transparent: Boolean(o.is_transparent),
    suggested_store_background: bg,
    harmony_note: note,
  }
}

function normalizeHex(value: unknown, fallback: string): string {
  if (typeof value === 'string' && isValidHex(value)) {
    return expandHex(value.trim())
  }
  return expandHex(fallback)
}

function normalizeThemeName(value: unknown): ThemeName | null {
  if (typeof value !== 'string') return null
  const name = value.trim() as ThemeName
  return THEME_NAMES.includes(name) ? name : null
}

/** Normaliza uma sugestão da IA — valida hex e resolve pageBg com fallback. */
export function normalizeThemeSuggestion(raw: unknown): ThemeAnalysisSuggestion | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const themeName = normalizeThemeName(o.themeName)
  if (!themeName) return null

  const theme = getTheme(themeName)
  const legacyBg: ThemeBackground =
    o.background === 'light' ? 'light' : o.background === 'dark' ? 'dark' : theme.defaultBackground

  const pageBg =
    typeof o.pageBg === 'string' && isValidHex(o.pageBg)
      ? expandHex(o.pageBg.trim())
      : defaultPageBgForTheme(theme, legacyBg)

  return {
    themeName,
    label: typeof o.label === 'string' ? o.label.trim().slice(0, 80) : theme.label,
    reason: typeof o.reason === 'string' ? o.reason.trim().slice(0, 120) : '',
    primary: normalizeHex(o.primary, theme.defaultColors.primary),
    secondary: normalizeHex(o.secondary, theme.defaultColors.secondary),
    accent: normalizeHex(o.accent, theme.defaultColors.accent),
    pageBg,
    background: inferThemeBackground(pageBg),
  }
}

export function parseThemeAnalysis(raw: string): ThemeAnalysisResult {
  let parsed: ThemeAnalysisResult
  try {
    parsed = JSON.parse(raw) as ThemeAnalysisResult
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('IA não retornou JSON válido')
    parsed = JSON.parse(match[0]) as ThemeAnalysisResult
  }

  const suggestions = (parsed.suggestions ?? [])
    .map(normalizeThemeSuggestion)
    .filter((s): s is ThemeAnalysisSuggestion => s !== null)

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
    logo_background: normalizeLogoBackground(parsed.logo_background),
    suggestions,
  }
}
