import { genAI, GEMINI_MODELS } from '@/lib/gemini'
import type { ThemeName } from '@/lib/themes'
import { THEME_NAMES } from '@/lib/themes'

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
  suggestions: ThemeAnalysisSuggestion[]
  summary:     string
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
- Cores harmonizadas com o logo
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

export function parseThemeAnalysis(raw: string): ThemeAnalysisResult {
  try {
    return JSON.parse(raw) as ThemeAnalysisResult
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('IA não retornou JSON válido')
    return JSON.parse(match[0]) as ThemeAnalysisResult
  }
}
