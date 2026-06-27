'use client'

import type { ThemeAnalysisSuggestion } from '@/lib/theme-ai'
import ThemePaletteSwatches from '@/components/admin/ThemePaletteSwatches'
import { THEMES } from '@/lib/themes'

type Props = {
  suggestions: ThemeAnalysisSuggestion[]
  onApply:     (s: ThemeAnalysisSuggestion) => void
}

export default function ThemeSuggestionCards({ suggestions, onApply }: Props) {
  if (!suggestions.length) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
      {suggestions.map((s, i) => {
        const theme = THEMES[s.themeName]
        return (
          <button
            key={`${s.themeName}-${i}`}
            type="button"
            onClick={() => onApply(s)}
            className="text-left p-3 rounded-xl border border-border bg-surface2 hover:border-primary transition-colors min-w-0 min-h-[44px]"
          >
            <ThemePaletteSwatches
              palette={{ primary: s.primary, accent: s.accent, pageBg: s.pageBg }}
              size="md"
              label={`Sugestão IA: primária ${s.primary}, destaque ${s.accent}, fundo ${s.pageBg}`}
            />
            <p className="font-syne font-semibold text-sm truncate mt-2">{s.label || theme?.label}</p>
            <p className="text-[11px] text-muted line-clamp-2 break-words mt-0.5">{s.reason}</p>
          </button>
        )
      })}
    </div>
  )
}
