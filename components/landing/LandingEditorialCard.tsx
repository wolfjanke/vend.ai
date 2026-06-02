import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'

const cardShell =
  'relative overflow-hidden bg-[#161616] border border-[#252525] rounded-[2px] px-5 py-6 sm:px-5 sm:py-6 min-w-0'

type Props = {
  number:      string
  title:       string
  children:    ReactNode
  className?:  string
  showDivider?: boolean
}

/** Card editorial — número fantasma, título Syne, conteúdo abaixo. */
export function LandingEditorialCard({
  number,
  title,
  children,
  className = '',
  showDivider = true,
}: Props) {
  return (
    <div className={`${cardShell} ${className}`}>
      <span
        className="absolute top-3 right-4 font-syne font-extrabold text-[56px] leading-none tracking-[-0.05em] text-white/[0.03] select-none pointer-events-none max-w-[50%] text-right break-all"
        aria-hidden
      >
        {number}
      </span>
      <div className="font-syne font-bold text-[15px] text-white mb-4 relative break-words pr-12">
        {title}
      </div>
      {showDivider && (
        <div className="h-px bg-[#252525] mb-3.5" style={{ height: '0.5px' }} aria-hidden />
      )}
      <div className="relative min-w-0">{children}</div>
    </div>
  )
}

type PainLineProps = { negative: string; positive: string }

export function LandingPainLines({ negative, positive }: PainLineProps) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex gap-2 text-xs leading-relaxed text-[#555555] min-w-0">
        <X size={14} className="text-[#FF4444] shrink-0 mt-0.5" aria-hidden />
        <span className="break-words">{negative}</span>
      </div>
      <div className="flex gap-2 text-xs leading-relaxed text-[#CCCCCC] min-w-0">
        <Check size={14} className="text-accent shrink-0 mt-0.5" aria-hidden />
        <span className="break-words">{positive}</span>
      </div>
    </div>
  )
}
