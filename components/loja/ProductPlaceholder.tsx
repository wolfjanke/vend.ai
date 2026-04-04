/**
 * Placeholders SVG realistas por categoria de produto.
 * Exibidos quando a variante não possui foto cadastrada.
 * Cada SVG simula uma silhueta/foto de peça de roupa sobre um fundo neutro.
 */

import React from 'react'

interface Props {
  category: string
  colorHex?: string
  className?: string
}

/**
 * Ajusta a cor da variante para o placeholder:
 * - Cores muito escuras (luminância < 0.08) → versão mais clara (+60% luminosidade)
 * - Cores muito claras (luminância > 0.85) → cinza médio neutro
 * - Demais → usa a cor original
 */
function clr(hex?: string): string {
  if (!hex) return '#7B8FA1'
  const h = hex.replace('#', '')
  if (h.length !== 6) return '#7B8FA1'
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  // Luminância relativa aproximada
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  if (lum > 0.82) return '#7B8FA1' // muito claro (branco, nude claro) → neutro
  if (lum < 0.06) {
    // muito escuro → clarear bastante
    const lighten = (v: number) => Math.round(Math.min(255, v * 255 + 90))
    return `#${lighten(r).toString(16).padStart(2, '0')}${lighten(g).toString(16).padStart(2, '0')}${lighten(b).toString(16).padStart(2, '0')}`
  }
  return hex
}

// ─── SVGs por categoria ──────────────────────────────────────────────────────

function Vestido({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="vd-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="vd-s" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Alças */}
      <path d="M55 30 Q50 10 38 8 L30 8 Q22 8 20 18 L24 50 Q30 44 40 42Z" fill="url(#vd-g)" />
      <path d="M105 30 Q110 10 122 8 L130 8 Q138 8 140 18 L136 50 Q130 44 120 42Z" fill="url(#vd-g)" />
      {/* Corpo superior */}
      <path d="M40 42 Q48 38 60 36 L80 34 L100 36 Q112 38 120 42 L128 80 Q115 76 80 76 Q45 76 32 80Z" fill="url(#vd-g)" />
      {/* Saia */}
      <path d="M32 80 Q45 76 80 76 Q115 76 128 80 L142 200 Q112 212 80 212 Q48 212 18 200Z" fill="url(#vd-g)" />
      {/* Brilho */}
      <path d="M40 42 Q48 38 65 37 L65 200 Q45 206 20 198Z" fill="url(#vd-s)" />
    </svg>
  )
}

function Blusa({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bl-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.9" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* Manga esquerda */}
      <path d="M10 50 L45 40 L55 90 L20 100Z" fill="url(#bl-g)" />
      {/* Manga direita */}
      <path d="M170 50 L135 40 L125 90 L160 100Z" fill="url(#bl-g)" />
      {/* Corpo */}
      <path d="M45 40 Q65 30 90 28 Q115 30 135 40 L145 160 Q112 168 90 168 Q68 168 35 160Z" fill="url(#bl-g)" />
      {/* Gola */}
      <ellipse cx="90" cy="32" rx="22" ry="10" fill="none" stroke={fill} strokeWidth="3" strokeOpacity="0.5" />
    </svg>
  )
}

function Camiseta({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 200 190" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="cm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id="cm-s" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Manga esquerda */}
      <path d="M10 40 L60 30 L65 75 L18 80Z" fill="url(#cm-g)" />
      {/* Manga direita */}
      <path d="M190 40 L140 30 L135 75 L182 80Z" fill="url(#cm-g)" />
      {/* Corpo */}
      <path d="M60 30 Q80 22 100 22 Q120 22 140 30 L148 170 Q120 176 100 176 Q80 176 52 170Z" fill="url(#cm-g)" />
      {/* Gola redonda */}
      <ellipse cx="100" cy="26" rx="20" ry="9" fill="none" stroke={fill} strokeWidth="3.5" strokeOpacity="0.4" />
      {/* Brilho */}
      <path d="M60 30 Q74 25 88 24 L85 170 Q68 174 52 168Z" fill="url(#cm-s)" />
    </svg>
  )
}

function Calca({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 160 230" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="ca-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* Cintura */}
      <rect x="18" y="10" width="124" height="20" rx="4" fill="url(#ca-g)" />
      {/* Corpo */}
      <path d="M18 28 L18 115 L75 115 L80 220 L80 220 L85 220 L90 115 L142 115 L142 28Z" fill="url(#ca-g)" />
      {/* Perna esquerda */}
      <path d="M18 115 L75 115 L80 220 L18 215Z" fill="url(#ca-g)" />
      {/* Perna direita */}
      <path d="M142 115 L90 115 L85 220 L142 215Z" fill="url(#ca-g)" />
      {/* Costura central */}
      <line x1="80" y1="28" x2="80" y2="115" stroke="#ffffff30" strokeWidth="1.5" />
    </svg>
  )
}

function Bermuda({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x="18" y="10" width="124" height="18" rx="4" fill="url(#bm-g)" />
      <path d="M18 26 L18 90 L72 90 L80 150 L88 150 L96 90 L142 90 L142 26Z" fill="url(#bm-g)" />
      <path d="M18 90 L72 90 L80 150 L18 148Z" fill="url(#bm-g)" />
      <path d="M142 90 L96 90 L88 150 L142 148Z" fill="url(#bm-g)" />
      <line x1="80" y1="26" x2="80" y2="90" stroke="#ffffff30" strokeWidth="1.5" />
    </svg>
  )
}

function Shorts({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="sh-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x="18" y="10" width="124" height="16" rx="4" fill="url(#sh-g)" />
      <path d="M18 24 L18 72 L70 72 L80 115 L90 115 L100 72 L142 72 L142 24Z" fill="url(#sh-g)" />
      <path d="M18 72 L70 72 L80 115 L18 112Z" fill="url(#sh-g)" />
      <path d="M142 72 L100 72 L90 115 L142 112Z" fill="url(#sh-g)" />
    </svg>
  )
}

function Conjunto({ fill }: { fill: string }) {
  const fill2 = fill
  return (
    <svg viewBox="0 0 180 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="cj-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill2} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill2} stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* Top */}
      <path d="M15 38 L50 28 L55 70 L20 76Z" fill="url(#cj-g)" />
      <path d="M165 38 L130 28 L125 70 L160 76Z" fill="url(#cj-g)" />
      <path d="M50 28 Q70 18 90 16 Q110 18 130 28 L138 105 Q110 110 90 110 Q70 110 42 105Z" fill="url(#cj-g)" />
      <ellipse cx="90" cy="20" rx="18" ry="8" fill="none" stroke={fill} strokeWidth="2.5" strokeOpacity="0.4" />
      {/* Calça */}
      <rect x="42" y="118" width="96" height="14" rx="3" fill="url(#cj-g)" />
      <path d="M42 130 L42 182 L86 182 L90 232 L94 232 L98 182 L138 182 L138 130Z" fill="url(#cj-g)" />
      <path d="M42 182 L86 182 L90 232 L42 230Z" fill="url(#cj-g)" />
      <path d="M138 182 L98 182 L94 232 L138 230Z" fill="url(#cj-g)" />
    </svg>
  )
}

function Saia({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="sa-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="sa-s" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Cós */}
      <rect x="32" y="20" width="96" height="22" rx="6" fill="url(#sa-g)" />
      {/* Corpo plissado */}
      <path d="M32 40 L10 190 Q40 198 80 198 Q120 198 150 190 L128 40Z" fill="url(#sa-g)" />
      {/* Dobras plissadas */}
      <line x1="56" y1="40" x2="42" y2="192" stroke="#ffffff18" strokeWidth="2" />
      <line x1="80" y1="40" x2="80" y2="195" stroke="#ffffff18" strokeWidth="2" />
      <line x1="104" y1="40" x2="118" y2="192" stroke="#ffffff18" strokeWidth="2" />
      <path d="M32 40 L56 40 L42 192 Q20 196 10 190Z" fill="url(#sa-s)" />
    </svg>
  )
}

function Moletom({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 200 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="ml-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.9" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* Manga esquerda */}
      <path d="M8 48 L62 34 L68 90 L15 98Z" fill="url(#ml-g)" />
      {/* Manga direita */}
      <path d="M192 48 L138 34 L132 90 L185 98Z" fill="url(#ml-g)" />
      {/* Capuz */}
      <path d="M68 30 Q80 8 100 6 Q120 8 132 30 L125 50 Q112 40 100 40 Q88 40 75 50Z" fill="url(#ml-g)" />
      {/* Corpo */}
      <path d="M62 34 Q78 26 100 24 Q122 26 138 34 L148 190 Q122 198 100 198 Q78 198 52 190Z" fill="url(#ml-g)" />
      {/* Bolso canguru */}
      <path d="M68 130 Q80 126 100 126 Q120 126 132 130 L132 168 Q120 172 100 172 Q80 172 68 168Z" fill="none" stroke="#ffffff22" strokeWidth="2" />
    </svg>
  )
}

function Casaco({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="cs-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="cs-s" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Manga esquerda */}
      <path d="M6 46 L58 30 L65 95 L14 102Z" fill="url(#cs-g)" />
      {/* Manga direita */}
      <path d="M194 46 L142 30 L135 95 L186 102Z" fill="url(#cs-g)" />
      {/* Corpo */}
      <path d="M58 30 Q78 20 100 18 Q122 20 142 30 L150 200 Q122 208 100 208 Q78 208 50 200Z" fill="url(#cs-g)" />
      {/* Abertura frontal */}
      <line x1="100" y1="20" x2="100" y2="204" stroke="#ffffff28" strokeWidth="2.5" />
      {/* Gola */}
      <path d="M72 30 Q82 18 100 16 Q118 18 128 30 L120 46 Q110 36 100 36 Q90 36 80 46Z" fill="url(#cs-g)" />
      {/* Brilho */}
      <path d="M58 30 Q72 22 88 20 L85 200 Q68 206 50 198Z" fill="url(#cs-s)" />
    </svg>
  )
}

function Infantil({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="if-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.9" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Manguinha esquerda */}
      <path d="M12 44 L50 34 L54 68 L16 72Z" fill="url(#if-g)" />
      {/* Manguinha direita */}
      <path d="M148 44 L110 34 L106 68 L144 72Z" fill="url(#if-g)" />
      {/* Corpo */}
      <path d="M50 34 Q65 26 80 24 Q95 26 110 34 L116 150 Q96 156 80 156 Q64 156 44 150Z" fill="url(#if-g)" />
      {/* Gola redonda grande */}
      <ellipse cx="80" cy="28" rx="17" ry="8" fill="none" stroke={fill} strokeWidth="3" strokeOpacity="0.45" />
      {/* Botão central */}
      <circle cx="80" cy="85" r="4" fill="#ffffff35" />
      <circle cx="80" cy="105" r="4" fill="#ffffff35" />
    </svg>
  )
}

function Outro({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="ot-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.7" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <rect x="30" y="30" width="100" height="120" rx="12" fill="url(#ot-g)" />
      <line x1="30" y1="70" x2="130" y2="70" stroke="#ffffff20" strokeWidth="2" />
      <rect x="55" y="16" width="50" height="18" rx="6" fill="url(#ot-g)" />
    </svg>
  )
}

// ─── Mapa categoria → componente ─────────────────────────────────────────────

const MAP: Record<string, React.ComponentType<{ fill: string }>> = {
  vestido:  Vestido,
  blusa:    Blusa,
  camiseta: Camiseta,
  calca:    Calca,
  bermuda:  Bermuda,
  shorts:   Shorts,
  conjunto: Conjunto,
  saia:     Saia,
  moletom:  Moletom,
  casaco:   Casaco,
  infantil: Infantil,
  outro:    Outro,
}

// ─── Componente público ───────────────────────────────────────────────────────

export default function ProductPlaceholder({ category, colorHex, className = '' }: Props) {
  const Svg = MAP[category] ?? MAP['outro']
  const fill = clr(colorHex)

  return (
    <div className={`w-full h-full flex items-center justify-center bg-surface2/60 ${className}`}>
      <div className="w-[55%] max-w-[130px] drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        <Svg fill={fill} />
      </div>
    </div>
  )
}
