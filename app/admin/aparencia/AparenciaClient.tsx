'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Image, Sparkles } from 'lucide-react'
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
import type { CustomCategory, StoreSettings } from '@/types'
import StoreThemePreview from '@/components/admin/StoreThemePreview'
import ColorHelpButton from '@/components/admin/ColorHelpButton'
import ThemeSuggestionCards from '@/components/admin/ThemeSuggestionCards'
import type { StorePreviewProduct } from '@/lib/preview-products'
import type { LogoBackgroundAnalysis, ThemeAnalysisSuggestion } from '@/lib/theme-ai'
import { adminCard } from '@/lib/admin-ui'
import { COLOR_PRESETS } from '@/lib/color-presets'
import { adjustHexForContrast, getHexContrastRatio, isValidHex } from '@/lib/theme-contrast'

type Initial = {
  theme_name:            string
  theme_primary_color:   string | null
  theme_secondary_color: string | null
  theme_accent_color:    string | null
  theme_background:      ThemeBackground
  theme_shimmer:         boolean
}

type Props = {
  slug:           string
  plan:           PlanSlug
  storeName:      string
  logoUrl:        string | null
  products:       StorePreviewProduct[]
  assistantName:  string
  tagline?:       string | null
  categoryNavStyle?: 'pills' | 'circles'
  customCategories?: CustomCategory[]
  vitrineSettings?:  Pick<
    StoreSettings,
    'headerLayout' | 'logoShape' | 'brandDisplay' | 'showSearch' | 'logoSize' | 'mobileGridCols'
  >
  initial:        Initial
}

/** Debounce: retorna valor atualizado após `delay` ms de inatividade */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

const STORE_CONTEXT_SUGGESTIONS = {
  segment: [
    'Moda',
    'Moda street',
    'Fitness',
    'Beleza',
    'Infantil',
    'Perfumaria',
  ],
  audience: [
    'Adulto',
    'Masculino',
    'Feminino',
    'Unissex',
    'Teen',
  ],
  personality: [
    'Casual',
    'Elegante',
    'Moderna',
    'Fitness',
    'Minimalista',
    'Pop',
  ],
} as const

const ANALYZE_STEPS = [
  'Lendo sua logo…',
  'Cruzando segmento, público e estilo…',
  'Gerando 3 sugestões de tema com IA…',
] as const

const PRIMARY_COLOR_HELP = [
  'Botão "Adicionar ao carrinho"',
  'Chips de categoria ativos',
  'Avatar e balões da Vi',
  'Bordas de foco nos campos',
  'Links em hover',
] as const

const ACCENT_COLOR_HELP = [
  'Preço dos produtos',
  'Badge "Promoção" e "Novo"',
  '"Últimas unidades disponíveis"',
  'Desconto em destaque no carrinho',
] as const

const CONTRAST_WARN_THRESHOLD = 3

function AnalyzeAiFeedback({ phase }: { phase: number }) {
  const stepIndex = Math.min(phase, ANALYZE_STEPS.length - 1)
  const progress = ((stepIndex + 1) / ANALYZE_STEPS.length) * 100

  return (
    <div
      className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 min-w-0"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="inline-block w-5 h-5 mt-0.5 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground break-words">
            Analisando seu logo com IA
          </p>
          <p className="text-xs text-muted mt-1 break-words">
            {ANALYZE_STEPS[stepIndex]}
          </p>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface2 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[11px] text-muted break-words">
        Isso costuma levar alguns segundos. Não feche esta janela.
      </p>
    </div>
  )
}

function ContextField({
  label,
  value,
  onChange,
  suggestions,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suggestions: readonly string[]
}) {
  const normalized = value.trim().toLowerCase()

  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2 min-w-0">
        {suggestions.map(s => {
          const selected = normalized === s.toLowerCase()
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors break-words ${
                selected
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-surface2 text-muted hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {s}
            </button>
          )
        })}
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Ou digite outro…"
        className="w-full min-h-[44px] px-3 rounded-xl bg-surface2 border border-border text-sm min-w-0"
      />
    </div>
  )
}

export default function AparenciaClient({
  slug,
  plan,
  storeName,
  logoUrl: storeLogoUrl,
  products,
  assistantName,
  tagline,
  categoryNavStyle = 'pills',
  customCategories = [],
  vitrineSettings = {},
  initial,
}: Props) {
  const available  = getAvailableThemes(plan)
  const canShimmer = canUseShimmer(plan)
  const canAnalyze = plan !== 'free'

  const [themeName, setThemeName] = useState<ThemeName>((initial.theme_name as ThemeName) || 'default')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const themeDef = getTheme(themeName)

  const [primary, setPrimary] = useState(initial.theme_primary_color || themeDef.defaultColors.primary)
  const [accent,  setAccent]  = useState(initial.theme_accent_color  || themeDef.defaultColors.accent)
  const [background, setBackground] = useState<ThemeBackground>(initial.theme_background)
  const [shimmer,   setShimmer]   = useState(initial.theme_shimmer)

  const [saving,  setSaving]  = useState(false)
  const [message, setMessage] = useState('')
  const [wcagWarning, setWcagWarning] = useState('')
  const [error,   setError]   = useState('')

  const [analyzeOpen,  setAnalyzeOpen]  = useState(false)
  const [segment,      setSegment]      = useState('moda')
  const [audience,     setAudience]     = useState('adulto')
  const [personality,  setPersonality]  = useState('moderna')
  const [analyzing,    setAnalyzing]    = useState(false)
  const [analyzePhase, setAnalyzePhase] = useState(0)
  const [suggestions,  setSuggestions]  = useState<ThemeAnalysisSuggestion[]>([])
  const [logoHarmony,    setLogoHarmony]  = useState<LogoBackgroundAnalysis | null>(null)
  const [highlightedColor, setHighlightedColor] = useState<'primary' | 'accent' | null>(null)

  useEffect(() => {
    if (!analyzing) {
      setAnalyzePhase(0)
      return
    }
    setAnalyzePhase(0)
    const t1 = setTimeout(() => setAnalyzePhase(1), 1_200)
    const t2 = setTimeout(() => setAnalyzePhase(2), 2_800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [analyzing])

  // Debounce de 300ms nos inputs hex para não recalcular preview a cada tecla
  const previewPrimary = useDebounce(primary, 300)
  const previewAccent  = useDebounce(accent,  300)
  const previewLogo = storeLogoUrl

  const pageBgHex =
    background === 'dark'
      ? themeDef.defaultColors.background
      : themeDef.defaultColors.backgroundLight

  const activePresetId = useMemo(() => {
    const match = COLOR_PRESETS.find(
      p =>
        p.primary.toUpperCase() === primary.trim().toUpperCase() &&
        p.accent.toUpperCase() === accent.trim().toUpperCase(),
    )
    return match?.id ?? null
  }, [primary, accent])

  const primaryContrastIssue = useMemo(() => {
    if (!isValidHex(primary)) return null
    if (getHexContrastRatio(primary, pageBgHex) >= CONTRAST_WARN_THRESHOLD) return null
    return 'Contraste baixo — texto pode ser difícil de ler'
  }, [primary, pageBgHex])

  const accentContrastIssue = useMemo(() => {
    if (!isValidHex(accent)) return null
    if (getHexContrastRatio(accent, pageBgHex) >= CONTRAST_WARN_THRESHOLD) return null
    return 'Destaque pouco visível no fundo escolhido'
  }, [accent, pageBgHex])

  const previewProps = useMemo(() => ({
    themeName,
    primary:       previewPrimary,
    accent:        previewAccent,
    background,
    shimmer:         shimmer && canShimmer,
    storeName,
    logoUrl:         previewLogo,
    products,
    assistantName,
    tagline,
    categoryNavStyle,
    customCategories,
    highlightedColor,
    plan,
    storeSlug:       slug,
    headerLayout:    vitrineSettings.headerLayout,
    logoShape:       vitrineSettings.logoShape,
    brandDisplay:    vitrineSettings.brandDisplay,
    showSearch:      vitrineSettings.showSearch,
    logoSize:        vitrineSettings.logoSize,
    mobileGridCols:  vitrineSettings.mobileGridCols,
  }), [
    themeName, previewPrimary, previewAccent, background, shimmer, canShimmer,
    storeName, previewLogo, products, assistantName, tagline, categoryNavStyle,
    customCategories, highlightedColor, plan, slug, vitrineSettings,
  ])

  const segmentOptions = useMemo(() => {
    const segments = new Set<string>()
    for (const name of THEME_NAMES) {
      for (const s of THEMES[name].forSegments) segments.add(s)
    }
    return ['all', ...Array.from(segments).sort()]
  }, [])

  const filteredThemeNames = useMemo(() => {
    if (segmentFilter === 'all') return THEME_NAMES
    return THEME_NAMES.filter(name =>
      THEMES[name].forSegments.includes(segmentFilter) ||
      THEMES[name].forSegments.includes('todos'),
    )
  }, [segmentFilter])

  const selectTheme = useCallback((name: ThemeName) => {
    if (!available.includes(name)) return
    const t = getTheme(name)
    setThemeName(name)
    setPrimary(t.defaultColors.primary)
    setAccent(t.defaultColors.accent)
    setBackground(t.defaultBackground)
    if (defaultShimmerForTheme(name)) setShimmer(true)
  }, [available])

  function applyPreset(preset: (typeof COLOR_PRESETS)[number]) {
    setPrimary(preset.primary)
    setAccent(preset.accent)
  }

  function applySuggestion(s: ThemeAnalysisSuggestion) {
    if (!available.includes(s.themeName)) return
    setThemeName(s.themeName)
    setPrimary(s.primary)
    setAccent(s.accent)
    setBackground(s.background)
    setAnalyzeOpen(false)
  }

  async function runAnalyze() {
    if (!storeLogoUrl) {
      setError('Cadastre a logo em Identidade antes de analisar.')
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      const imgRes = await fetch(storeLogoUrl)
      const blob   = await imgRes.blob()
      const b64    = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload  = () => resolve(String(r.result))
        r.onerror = reject
        r.readAsDataURL(blob)
      })
      const res  = await fetch('/api/theme/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ logo: b64, mimeType: blob.type || 'image/png', segment, audience, personality }),
      })
      const data = await res.json() as {
        suggestions?:     ThemeAnalysisSuggestion[]
        logo_background?: LogoBackgroundAnalysis
        error?:           string
      }
      if (!res.ok) throw new Error(data.error ?? 'Erro na análise')
      setSuggestions(data.suggestions ?? [])
      setLogoHarmony(data.logo_background ?? null)
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
    setWcagWarning('')
    try {
      const res  = await fetch('/api/admin/theme', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          theme_name:            themeName,
          theme_primary_color: primary,
          theme_accent_color:  accent,
          theme_background:      background,
          theme_shimmer:         canShimmer ? shimmer : false,
          theme_onboarding_done: true,
        }),
      })
      const data = await res.json() as { error?: string; contrastWarnings?: string[] }
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')
      setMessage('Tema salvo com sucesso!')
      if (data.contrastWarnings?.length) {
        setWcagWarning(data.contrastWarnings.join(' · '))
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-w-0">
      <div className="lg:col-span-2 space-y-5 min-w-0">

        {/* ── Tema ── */}
        <section className={`${adminCard} space-y-3`}>
          <h2 className="font-syne font-bold text-sm uppercase tracking-wide text-muted">Tema</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {segmentOptions.map(seg => (
              <button
                key={seg}
                type="button"
                onClick={() => setSegmentFilter(seg)}
                className={`shrink-0 min-h-[36px] px-3 rounded-full border text-xs capitalize ${
                  segmentFilter === seg
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-surface2 text-muted'
                }`}
              >
                {seg === 'all' ? 'Todos' : seg.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredThemeNames.map(name => {
              const t      = THEMES[name]
              const locked = !available.includes(name)
              return (
                <button
                  key={name}
                  type="button"
                  disabled={locked}
                  onClick={() => selectTheme(name)}
                  className={`text-left p-4 rounded-xl border min-h-[44px] min-w-0 transition-colors ${
                    themeName === name
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface2 hover:border-primary/40'
                  } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="font-syne font-semibold text-sm block truncate">{t.label}</span>
                  <span className="text-[11px] text-muted line-clamp-2 break-words">{t.description}</span>
                  {locked && <span className="text-[10px] text-primary mt-1 inline-block">Starter+</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Cores & fundo ── */}
        <section className={`${adminCard} space-y-4`}>
          <div>
            <h2 className="font-syne font-bold text-sm uppercase tracking-wide text-muted">Cores da marca</h2>
            <p className="text-xs text-muted mt-1 break-words">
              Escolha 2 cores ou use uma combinação sugerida. O fundo e os textos se ajustam automaticamente.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Combinações sugeridas
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {COLOR_PRESETS.map(preset => {
                const isActive = activePresetId === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`shrink-0 flex flex-col items-center gap-1.5 py-2 px-3 rounded-[10px] min-w-[72px] min-h-[44px] transition-colors ${
                      isActive
                        ? 'border-[1.5px] border-primary bg-primary/10'
                        : 'border border-border bg-surface2 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex gap-1">
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                        style={{ background: preset.primary }}
                        aria-hidden
                      />
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                        style={{ background: preset.accent }}
                        aria-hidden
                      />
                    </div>
                    <span className="text-[11px] text-muted">{preset.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-4 pt-1 border-t border-border">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="color"
                  value={primary}
                  onChange={e => setPrimary(e.target.value)}
                  onFocus={() => setHighlightedColor('primary')}
                  onBlur={() => setHighlightedColor(null)}
                  className="w-11 h-11 min-h-[44px] rounded-lg border border-border shrink-0 cursor-pointer"
                  aria-label="Cor primária"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-xs font-semibold text-foreground">Cor primária</p>
                    <ColorHelpButton title="Cor primária" items={[...PRIMARY_COLOR_HELP]} />
                  </div>
                  <p className="text-[11px] text-muted break-words">A cor da sua marca</p>
                </div>
                <input
                  type="text"
                  value={primary}
                  onChange={e => setPrimary(e.target.value)}
                  onFocus={() => setHighlightedColor('primary')}
                  onBlur={() => setHighlightedColor(null)}
                  className="w-[6.5rem] min-w-0 min-h-[44px] px-2 rounded-xl bg-surface2 border border-border text-xs font-mono"
                  aria-label="Cor primária (hex)"
                />
              </div>
              {primaryContrastIssue && (
                <div className="pl-14 space-y-1">
                  <p className="text-[11px] text-warm break-words">⚠️ {primaryContrastIssue}</p>
                  <button
                    type="button"
                    onClick={() => setPrimary(adjustHexForContrast(primary, pageBgHex))}
                    className="text-[11px] text-primary underline min-h-[32px]"
                  >
                    Ajustar automaticamente
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="color"
                  value={accent}
                  onChange={e => setAccent(e.target.value)}
                  onFocus={() => setHighlightedColor('accent')}
                  onBlur={() => setHighlightedColor(null)}
                  className="w-11 h-11 min-h-[44px] rounded-lg border border-border shrink-0 cursor-pointer"
                  aria-label="Cor de destaque"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-xs font-semibold text-foreground">Cor de destaque</p>
                    <ColorHelpButton title="Cor de destaque" items={[...ACCENT_COLOR_HELP]} />
                  </div>
                  <p className="text-[11px] text-muted break-words">O que chama atenção para comprar</p>
                </div>
                <input
                  type="text"
                  value={accent}
                  onChange={e => setAccent(e.target.value)}
                  onFocus={() => setHighlightedColor('accent')}
                  onBlur={() => setHighlightedColor(null)}
                  className="w-[6.5rem] min-w-0 min-h-[44px] px-2 rounded-xl bg-surface2 border border-border text-xs font-mono"
                  aria-label="Cor de destaque (hex)"
                />
              </div>
              {accentContrastIssue && (
                <div className="pl-14 space-y-1">
                  <p className="text-[11px] text-warm break-words">⚠️ {accentContrastIssue}</p>
                  <button
                    type="button"
                    onClick={() => setAccent(adjustHexForContrast(accent, pageBgHex))}
                    className="text-[11px] text-primary underline min-h-[32px]"
                  >
                    Ajustar automaticamente
                  </button>
                </div>
              )}
            </div>
          </div>

        <div className="space-y-2 pt-1 border-t border-border">
          <h2 className="font-syne font-bold text-sm uppercase tracking-wide text-muted">Fundo da vitrine</h2>
          <p className="text-[11px] text-muted break-words">
            Define o clima geral da loja. Textos e cards se ajustam automaticamente.
          </p>
          <div className="flex flex-wrap gap-2">
            {themeDef.allowLightBackground && (
              <button
                type="button"
                onClick={() => setBackground('light')}
                className={`min-h-[44px] px-4 rounded-xl border text-sm text-left ${
                  background === 'light' ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <span className="block font-medium">Claro</span>
                <span className="block text-[10px] text-muted mt-0.5">Vitrine clara, produto em destaque</span>
              </button>
            )}
            {themeDef.allowDarkBackground && (
              <button
                type="button"
                onClick={() => setBackground('dark')}
                className={`min-h-[44px] px-4 rounded-xl border text-sm text-left ${
                  background === 'dark' ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <span className="block font-medium">Escuro</span>
                <span className="block text-[10px] text-muted mt-0.5">Vitrine escura, look premium</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Shimmer ── */}
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

        </section>

        {/* ── Logo & IA — usa a logo cadastrada em Identidade ── */}
        {canAnalyze ? (
          <section className={`${adminCard} space-y-3`}>
            <h2 className="font-syne font-bold text-sm uppercase tracking-wide text-muted">Logo & IA</h2>
            <p className="text-xs text-muted break-words">
              A IA usa a logo cadastrada em{' '}
              <Link href="/admin/loja?secao=identidade" className="text-primary underline">
                Identidade
              </Link>
              {' '}para sugerir cores e tema.
            </p>

            {storeLogoUrl ? (
              <div className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl min-w-0">
                <img
                  src={storeLogoUrl}
                  alt="Logo da loja"
                  className="h-12 w-12 shrink-0 object-contain rounded"
                />
                <p className="text-xs text-muted break-words min-w-0">
                  Preview da logo atual. Para trocar, edite em Identidade.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted break-words rounded-lg border border-dashed border-border bg-surface2/80 px-3 py-3">
                Nenhuma logo cadastrada.{' '}
                <Link href="/admin/loja?secao=identidade" className="text-primary underline">
                  Envie em Identidade
                </Link>
                {' '}para habilitar a análise com IA.
              </p>
            )}

            {analyzing && !analyzeOpen && (
              <AnalyzeAiFeedback phase={analyzePhase} />
            )}

            <button
              type="button"
              onClick={() => setAnalyzeOpen(true)}
              disabled={!storeLogoUrl || analyzing}
              className="w-full min-h-[44px] rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/10 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Sparkles size={16} className="shrink-0" aria-hidden />
              {analyzing ? 'Analisando seu logo…' : 'Analisar com IA'}
            </button>
          </section>
        ) : (
          <div className={adminCard}>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Image size={16} className="shrink-0" aria-hidden />
              <span>Análise de tema com IA disponível nos planos pagos</span>
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <ThemeSuggestionCards suggestions={suggestions} onApply={applySuggestion} />
        )}

        {logoHarmony && (
          <div className={`${adminCard} space-y-3 min-w-0`}>
            <h3 className="font-syne font-semibold text-sm">Dica de harmonização</h3>
            <p className="text-xs text-muted break-words">{logoHarmony.harmony_note}</p>
            <p className="text-[11px] text-muted break-words">
              Fundo detectado na logo:{' '}
              <span className="font-mono" style={{ color: logoHarmony.color }}>
                {logoHarmony.color}
              </span>
              {logoHarmony.is_transparent ? ' (transparente)' : ''}
            </p>
            <button
              type="button"
              onClick={() => setBackground(logoHarmony.suggested_store_background)}
              className="w-full min-h-[44px] rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/10"
            >
              Aplicar fundo sugerido (
              {logoHarmony.suggested_store_background === 'light' ? 'claro' : 'escuro'})
            </button>
          </div>
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
        {wcagWarning && (
          <p className="text-sm text-warm break-words" role="status">
            Acessibilidade: {wcagWarning}. Você pode ajustar as cores depois.
          </p>
        )}
        {error   && <p className="text-sm text-warm  break-words">{error}</p>}
      </div>

      {/* ── Preview ao vivo ── props memoizadas para evitar re-render desnecessário */}
      <div className="lg:col-span-3 min-w-0 sticky top-20 self-start">
        <p className="text-xs text-muted mb-1">Preview ao vivo</p>
        <p className="text-[11px] text-muted mb-2 break-words">
          Header, busca e grid refletem as opções em{' '}
          <Link href="/admin/loja?secao=identidade" className="text-primary underline">Identidade</Link>.
        </p>
        <StoreThemePreview {...previewProps} />
      </div>

      {/* ── Modal IA ── */}
      {analyzeOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-bg/80"
            aria-label="Fechar"
            disabled={analyzing}
            onClick={() => !analyzing && setAnalyzeOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md max-w-[calc(100vw-16px)] max-h-[calc(100dvh-32px)] overflow-y-auto rounded-2xl bg-surface border border-border p-4 space-y-3">
            <h3 className="font-syne font-bold text-lg">Contexto da loja</h3>
            {analyzing ? (
              <AnalyzeAiFeedback phase={analyzePhase} />
            ) : (
              <p className="text-xs text-muted break-words">
                Toque em uma sugestão ou personalize no campo abaixo.
              </p>
            )}
            <div className={analyzing ? 'opacity-50 pointer-events-none space-y-3' : 'space-y-3'}>
            <ContextField
              label="Segmento"
              value={segment}
              onChange={setSegment}
              suggestions={STORE_CONTEXT_SUGGESTIONS.segment}
            />
            <ContextField
              label="Público"
              value={audience}
              onChange={setAudience}
              suggestions={STORE_CONTEXT_SUGGESTIONS.audience}
            />
            <ContextField
              label="Personalidade"
              value={personality}
              onChange={setPersonality}
              suggestions={STORE_CONTEXT_SUGGESTIONS.personality}
            />
            </div>
            <button
              type="button"
              onClick={runAnalyze}
              disabled={analyzing}
              className="w-full min-h-[44px] rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-70"
            >
              {analyzing ? 'Aguarde a análise…' : 'Gerar sugestões'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
