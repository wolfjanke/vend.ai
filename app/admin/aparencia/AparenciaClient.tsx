'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import type { StorePreviewProduct } from '@/lib/preview-products'
import type { LogoBackgroundAnalysis, ThemeAnalysisSuggestion } from '@/lib/theme-ai'
import { adminCard } from '@/lib/admin-ui'

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
  slug:           string
  plan:           PlanSlug
  storeName:      string
  logoUrl:        string | null
  products:       StorePreviewProduct[]
  assistantName:  string
  tagline?:       string | null
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
  initial,
}: Props) {
  const available  = getAvailableThemes(plan)
  const canShimmer = canUseShimmer(plan)
  const canAnalyze = plan !== 'free'

  const [themeName, setThemeName] = useState<ThemeName>((initial.theme_name as ThemeName) || 'default')
  const themeDef = getTheme(themeName)

  const [primary, setPrimary] = useState(initial.theme_primary_color || themeDef.defaultColors.primary)
  const [accent,  setAccent]  = useState(initial.theme_accent_color  || themeDef.defaultColors.accent)
  const [background, setBackground] = useState<ThemeBackground>(initial.theme_background)
  const [shimmer,   setShimmer]   = useState(initial.theme_shimmer)
  const [logoUrl,   setLogoUrl]   = useState<string | null>(initial.theme_logo_url)
  const [fileName,  setFileName]  = useState<string | null>(null)

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
  const [uploadConfigured, setUploadConfigured] = useState<boolean | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const showLogoSection = canAnalyze && uploadConfigured === true

  useEffect(() => {
    if (!canAnalyze) {
      setUploadConfigured(false)
      return
    }
    let cancelled = false
    fetch('/api/upload/status')
      .then(res => res.json())
      .then((data: { configured?: boolean }) => {
        if (!cancelled) setUploadConfigured(Boolean(data.configured))
      })
      .catch(() => {
        if (!cancelled) setUploadConfigured(false)
      })
    return () => { cancelled = true }
  }, [canAnalyze])

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

  const previewLogo = logoUrl ?? storeLogoUrl

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
  }), [
    themeName, previewPrimary, previewAccent, background, shimmer, canShimmer,
    storeName, previewLogo, products, assistantName, tagline,
  ])

  const selectTheme = useCallback((name: ThemeName) => {
    if (!available.includes(name)) return
    const t = getTheme(name)
    setThemeName(name)
    setPrimary(t.defaultColors.primary)
    setAccent(t.defaultColors.accent)
    setBackground(t.defaultBackground)
    if (defaultShimmerForTheme(name)) setShimmer(true)
  }, [available])

  function applySuggestion(s: ThemeAnalysisSuggestion) {
    if (!available.includes(s.themeName)) return
    setThemeName(s.themeName)
    setPrimary(s.primary)
    setAccent(s.accent)
    setBackground(s.background)
    setAnalyzeOpen(false)
  }

  async function handleLogoUpload(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res  = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json() as { url?: string; error?: string }
    if (!res.ok) {
      // Erro de configuração do servidor — não expor ao lojista
      if (data.error === 'cloudinary_not_configured' || res.status === 503) {
        throw new Error('upload_config_error')
      }
      throw new Error(data.error ?? 'Falha no upload')
    }
    setLogoUrl(data.url!)
    return data.url!
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    setError('')
    try {
      await handleLogoUpload(f)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload falhou'
      if (msg === 'upload_config_error') {
        // Erro de configuração: mostrar só no console, nunca para o lojista
        console.warn('[upload] Cloudinary não configurado no servidor.')
        setError('Upload temporariamente indisponível. Tente novamente mais tarde.')
      } else {
        setError(msg)
      }
    }
  }

  async function runAnalyze() {
    if (!logoUrl) { setError('Envie um logo antes de analisar.'); return }
    setAnalyzing(true)
    setError('')
    try {
      const imgRes = await fetch(logoUrl)
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
          theme_logo_url:        logoUrl,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {THEME_NAMES.map(name => {
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
          <h2 className="font-syne font-bold text-sm uppercase tracking-wide text-muted">Cores</h2>
          {([
            { key: 'primary' as const, label: 'Primária', val: primary, set: setPrimary },
            { key: 'accent' as const, label: 'Destaque', val: accent, set: setAccent },
          ]).map(({ key, label, val, set }) => (
              <div key={key} className="flex items-center gap-3 min-w-0">
                <input
                  type="color"
                  value={val}
                  onChange={e => set(e.target.value)}
                  className="w-11 h-11 min-h-[44px] rounded-lg border border-border shrink-0 cursor-pointer"
                  aria-label={label}
                />
                <input
                  type="text"
                  value={val}
                  onChange={e => set(e.target.value)}
                  className="flex-1 min-w-0 min-h-[44px] px-3 rounded-xl bg-surface2 border border-border text-sm font-mono break-all"
                  aria-label={label}
                />
              </div>
            ))}

        {/* ── Fundo ── */}
        <div className="space-y-2">
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

        {/* ── Logo & IA — plano pago + Cloudinary configurado no servidor ── */}
        {showLogoSection ? (
          <section className={`${adminCard} space-y-2`}>
            <h2 className="font-syne font-bold text-sm uppercase tracking-wide text-muted">Logo & IA</h2>
            <p className="text-xs text-muted break-words rounded-lg border border-border bg-surface2/80 px-3 py-2">
              A logo principal da loja (WhatsApp e compartilhamentos) fica em{' '}
              <Link href="/admin/configuracoes" className="text-primary underline">
                Configurações
              </Link>
              . Aqui você envia uma versão para análise de tema e preview.
            </p>

            {/* Input de arquivo customizado */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              className="flex items-center gap-3 p-3 bg-surface2 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/60 transition-colors min-h-[44px]"
            >
              <span className="text-2xl shrink-0">📷</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {fileName ?? 'Clique para escolher a logo'}
                </div>
                <div className="text-xs text-muted">PNG, JPG ou SVG — recomendado 200×200 px</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {logoUrl && (
              <img src={logoUrl} alt="Logo atual" className="h-12 w-auto max-w-full object-contain rounded" />
            )}

            {analyzing && !analyzeOpen && (
              <AnalyzeAiFeedback phase={analyzePhase} />
            )}

            <button
              type="button"
              onClick={() => setAnalyzeOpen(true)}
              disabled={!logoUrl || analyzing}
              className="w-full min-h-[44px] rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/10 disabled:opacity-50"
            >
              {analyzing ? 'Analisando seu logo…' : 'Analisar com IA'}
            </button>
          </section>
        ) : !canAnalyze ? (
          <div className={adminCard}>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>📸</span>
              <span>Upload de logo disponível nos planos pagos</span>
            </div>
          </div>
        ) : null}

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
        <p className="text-xs text-muted mb-2">Preview ao vivo</p>
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
