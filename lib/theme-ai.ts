import { genAI, GEMINI_MODELS } from '@/lib/gemini'
import type { ThemeName } from '@/lib/themes'
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
  background:  'light' | 'dark'
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

export function buildThemeAnalysisPrompt(input: {
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
      "background": "light ou dark"
    }
  ]
}

Regras:
- Exatamente 3 sugestões em "suggestions", themeName diferentes quando possível
- Cores harmonizadas com o logo; secondary pode repetir tom da primária
- logo_background.color: cor dominante de fundo detectada na logo
- segmento: ${input.segment}
- público: ${input.audience}
- personalidade: ${input.personality}
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

export function parseThemeAnalysis(raw: string): ThemeAnalysisResult {
  let parsed: ThemeAnalysisResult
  try {
    parsed = JSON.parse(raw) as ThemeAnalysisResult
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('IA não retornou JSON válido')
    parsed = JSON.parse(match[0]) as ThemeAnalysisResult
  }
  return {
    ...parsed,
    logo_background: normalizeLogoBackground(parsed.logo_background),
  }
}
