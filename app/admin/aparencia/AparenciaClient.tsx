'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import {
  THEMES,
  THEME_NAMES,
  getAvailableThemes,
  getTheme,
  canUseShimmer,
  defaultShimmerForTheme,
  type ThemeBackground,
  type ThemeName,
} from '@/lib/themes'
import type { PlanSlug } from '@/lib/plans'
import StoreThemePreview from '@/components/admin/StoreThemePreview'
import ThemeSuggestionCards from '@/components/admin/ThemeSuggestionCards'
import type { ThemeAnalysisSuggestion } from '@/lib/theme-ai'

type Initial = {
  theme_name:            string
  theme_primary_color:   string | null
  theme_secondary_color: string | null
  theme_accent_color:    string | null
  theme_background:      ThemeBackground
  theme_shimmer:         boolean
  theme_logo_url:        string | null
}

type Props = {
  slug:     string
  plan:     PlanSlug
  initial:  Initial
}

export default function AparenciaClient({ slug, plan, initial }: Props) {
  const available = getAvailableThemes(plan)
  const canShimmer = canUseShimmer(plan)
  const canAnalyze = plan !== 'free'

  const [themeName, setThemeName] = useState<ThemeName>((initial.theme_name as ThemeName) || 'default')
  const themeDef = getTheme(themeName)

  const [primary, setPrimary] = useState(
    initial.theme_primary_color || themeDef.defaultColors.primary,
  )
  const [secondary, setSecondary] = useState(
    initial.theme_secondary_color || themeDef.defaultColors.secondary,
  )
  const [accent, setAccent] = useState(
    initial.theme_accent_color || themeDef.defaultColors.accent,
  )
  const [background, setBackground] = useState<ThemeBackground>(initial.theme_background)
  const [shimmer, setShimmer] = useState(initial.theme_shimmer)
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.theme_logo_url)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [analyzeOpen, setAnalyzeOpen] = useState(false)
  const [segment, setSegment] = useState('moda')
  const [audience, setAudience] = useState('adulto')
  const [personality, setPersonality] = useState('moderna')
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<ThemeAnalysisSuggestion[]>([])

  const selectTheme = useCallback((name: ThemeName) => {
    if (!available.includes(name)) return
    const t = getTheme(name)
    setThemeName(name)
    setPrimary(t.defaultColors.primary)
    setSecondary(t.defaultColors.secondary)
    setAccent(t.defaultColors.accent)
    setBackground(t.defaultBackground)
    if (defaultShimmerForTheme(name)) setShimmer(true)
  }, [available])

  function applySuggestion(s: ThemeAnalysisSuggestion) {
    if (!available.includes(s.themeName)) return
    setThemeName(s.themeName)
    setPrimary(s.primary)
    setSecondary(s.secondary)
    setAccent(s.accent)
    setBackground(s.background)
    setAnalyzeOpen(false)
  }

  async function handleLogoUpload(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Falha no upload')
    setLogoUrl(data.url)
    return data.url as string
  }

  async function runAnalyze() {
    if (!logoUrl) {
      setError('Envie um logo antes de analisar.')
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      const imgRes = await fetch(logoUrl)
      const blob = await imgRes.blob()
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = reject
        r.readAsDataURL(blob)
      })
      const res = await fetch('/api/theme/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          logo: b64,
          mimeType: blob.type || 'image/png',
          segment,
          audience,
          personality,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro na análise')
      setSuggestions(data.suggestions ?? [])
      setAnalyzeOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro na análise')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/admin/theme', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          theme_name:            themeName,
          theme_primary_color:   primary,
          theme_secondary_color: secondary,
          theme_accent_color:    accent,
          theme_background:      background,
          theme_shimmer:         canShimmer ? shimmer : false,
          theme_logo_url:        logoUrl,
          theme_onboarding_done: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')
      setMessage('Tema salvo com sucesso!')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-w-0">
      <div className="lg:col-span-2 space-y-5 min-w-0">
        <section className="space-y-3">
          <h2 className="font-syne font-bold text-sm uppercase tracking-wide text-muted">Tema</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {THEME_NAMES.map(name => {
              const t = THEMES[name]
              const locked = !available.includes(name)
              return (
                <button
                  key={name}
                  type="button"
                  disabled={locked}
                  onClick={() => selectTheme(name)}
                  className={`text-left p-3 rounded-xl border min-h-[44px] min-w-0 transition-colors ${
                    themeName === name
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface2 hover:border-primary/40'
                  } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="font-syne font-semibold text-sm block truncate">{t.label}</span>
                  <span className="text-[11px] text-muted line-clamp-2 break-words">{t.description}</span>
                  {locked && (
                    <span className="text-[10px] text-primary mt-1 inline-block">Starter+</span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-syne font-bold text-sm uppercase tracking-wide text-muted">Cores</h2>
          {(['primary', 'secondary', 'accent'] as const).map(key => {
            const val = key === 'primary' ? primary : key === 'secondary' ? secondary : accent
            const set = key === 'primary' ? setPrimary : key === 'secondary' ? setSecondary : setAccent
            return (
              <div key={key} className="flex items-center gap-3 min-w-0">
                <input
                  type="color"
                  value={val}
                  onChange={e => set(e.target.value)}
                  className="w-11 h-11 min-h-[44px] rounded-lg border border-border shrink-0 cursor-pointer"
                  aria-label={key}
                />
                <input
                  type="text"
                  value={val}
                  onChange={e => set(e.target.value)}
                  className="flex-1 min-w-0 min-h-[44px] px-3 rounded-xl bg-surface2 border border-border text-sm font-mono break-all"
                />
              </div>
            )
          })}
        </section>

        <section className="space-y-2">
          <h2 className="font-syne font-bold text-sm uppercase tracking-wide text-muted">Fundo</h2>
          <div className="flex flex-wrap gap-2">
            {themeDef.allowLightBackground && (
              <button
                type="button"
                onClick={() => setBackground('light')}
                className={`min-h-[44px] px-4 rounded-xl border text-sm ${
                  background === 'light' ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                Claro
              </button>
            )}
            {themeDef.allowDarkBackground && (
              <button
                type="button"
                onClick={() => setBackground('dark')}
                className={`min-h-[44px] px-4 rounded-xl border text-sm ${
                  background === 'dark' ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                Escuro
              </button>
            )}
          </div>
        </section>

        {canShimmer && (
          <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={shimmer}
              onChange={e => setShimmer(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm">Efeito shimmer nos cards</span>
          </label>
        )}

        {canAnalyze && (
          <section className="space-y-2 border-t border-border pt-4">
            <h2 className="font-syne font-bold text-sm uppercase tracking-wide text-muted">Logo & IA</h2>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm min-h-[44px]"
              onChange={async e => {
                const f = e.target.files?.[0]
                if (!f) return
                try {
                  await handleLogoUpload(f)
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : 'Upload falhou')
                }
              }}
            />
            {logoUrl && (
              <img src={logoUrl} alt="" className="h-12 w-auto max-w-full object-contain rounded" />
            )}
            <button
              type="button"
              onClick={() => setAnalyzeOpen(true)}
              disabled={!logoUrl || analyzing}
              className="w-full min-h-[44px] rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/10 disabled:opacity-50"
            >
              {analyzing ? 'Analisando…' : 'Analisar com IA'}
            </button>
          </section>
        )}

        {suggestions.length > 0 && (
          <ThemeSuggestionCards suggestions={suggestions} onApply={applySuggestion} />
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 min-h-[44px] rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
          <Link
            href={`/${slug}`}
            target="_blank"
            className="flex-1 min-h-[44px] flex items-center justify-center rounded-xl border border-border text-sm font-medium hover:border-primary"
          >
            Ver loja completa
          </Link>
        </div>
        {message && <p className="text-sm text-accent break-words">{message}</p>}
        {error && <p className="text-sm text-warm break-words">{error}</p>}
      </div>

      <div className="lg:col-span-3 min-w-0 sticky top-20 self-start">
        <p className="text-xs text-muted mb-2">Preview ao vivo</p>
        <StoreThemePreview
          themeName={themeName}
          primary={primary}
          secondary={secondary}
          accent={accent}
          background={background}
          shimmer={shimmer && canShimmer}
        />
      </div>

      {analyzeOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-bg/80"
            aria-label="Fechar"
            onClick={() => setAnalyzeOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md max-w-[calc(100vw-16px)] rounded-2xl bg-surface border border-border p-4 space-y-3">
            <h3 className="font-syne font-bold text-lg">Contexto da loja</h3>
            {[
              { label: 'Segmento', value: segment, set: setSegment },
              { label: 'Público', value: audience, set: setAudience },
              { label: 'Personalidade', value: personality, set: setPersonality },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-xs text-muted block mb-1">{label}</label>
                <input
                  value={value}
                  onChange={e => set(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-surface2 border border-border text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={runAnalyze}
              disabled={analyzing}
              className="w-full min-h-[44px] rounded-xl bg-primary text-white font-semibold text-sm"
            >
              {analyzing ? 'Analisando…' : 'Gerar sugestões'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
