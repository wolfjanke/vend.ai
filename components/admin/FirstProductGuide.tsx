'use client'

type CadastroStep = 1 | 2 | 3 | 4

const GUIDE_STEPS = [
  { id: 1, label: 'Foto',    hint: 'Envie a foto da peça' },
  { id: 2, label: 'Preço',   hint: 'Defina quanto custa' },
  { id: 3, label: 'Estoque', hint: 'Informe tamanhos disponíveis' },
] as const

function guideStepFromForm(step: CadastroStep): 1 | 2 | 3 {
  if (step <= 2) return 1
  if (step === 3) return 2
  return 3
}

type Props = {
  formStep: CadastroStep
}

export default function FirstProductGuide({ formStep }: Props) {
  const active = guideStepFromForm(formStep)

  return (
    <div className="mb-4 p-4 rounded-2xl border border-accent/30 bg-accent/5 min-w-0">
      <p className="font-syne font-bold text-sm text-foreground mb-1">
        Primeiro produto — prepare a Vi para o Direct
      </p>
      <p className="text-xs text-muted break-words mb-3">
        Foto, preço e estoque são o mínimo para a Vi responder com segurança quando alguém perguntar &quot;Tem no P?&quot;
      </p>
      <div className="grid grid-cols-3 gap-2 min-w-0">
        {GUIDE_STEPS.map(s => {
          const done = active > s.id
          const isActive = active === s.id
          return (
            <div
              key={s.id}
              className={`rounded-xl border px-2 py-2.5 text-center min-w-0 transition-colors ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : done
                    ? 'border-accent/40 bg-accent/5 text-accent'
                    : 'border-border bg-surface2 text-muted'
              }`}
            >
              <span className="block font-syne font-bold text-sm tabular-nums">{s.id}</span>
              <span className="block text-xs font-semibold truncate">{s.label}</span>
              {isActive && (
                <span className="block text-[10px] mt-0.5 break-words leading-tight opacity-90">{s.hint}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { guideStepFromForm }
