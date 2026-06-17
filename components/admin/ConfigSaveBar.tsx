'use client'

interface Props {
  loading: boolean
  saved:   boolean
  error:   string
  onSave:  () => void
}

/** Salvar visível em qualquer aba — acima da nav inferior no mobile. */
export default function ConfigSaveBar({ loading, saved, error, onSave }: Props) {
  return (
    <div
      className="fixed left-0 right-0 z-40 max-w-[100vw] border-t border-border bg-surface/95 backdrop-blur-md px-4 py-3 md:px-6 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] md:bottom-0"
      role="region"
      aria-label="Salvar configurações"
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        {error && (
          <p className="text-xs sm:text-sm text-warm break-words" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className={`w-full min-h-[48px] py-3 rounded-[12px] font-syne font-bold text-sm transition-all ${
            saved ? 'bg-accent text-bg' : 'bg-primary text-white hover:shadow-[0_4px_20px_var(--primary-glow)]'
          } disabled:opacity-60`}
        >
          {loading ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
