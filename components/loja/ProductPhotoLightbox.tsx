'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SWIPE_THRESHOLD_PX = 48

type Props = {
  photos:       string[]
  initialIndex?: number
  productName:  string
  onClose:      () => void
}

export default function ProductPhotoLightbox({
  photos,
  initialIndex = 0,
  productName,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)
  const multi = photos.length > 1

  useEffect(() => {
    setIndex(initialIndex)
  }, [initialIndex, photos])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (!multi) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setIndex(i => (i - 1 + photos.length) % photos.length)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setIndex(i => (i + 1) % photos.length)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, multi, photos.length])

  const goPrev = useCallback(() => {
    setIndex(i => (i - 1 + photos.length) % photos.length)
  }, [photos.length])

  const goNext = useCallback(() => {
    setIndex(i => (i + 1) % photos.length)
  }, [photos.length])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!multi || touchStartX.current == null) return
    const endX = e.changedTouches[0]?.clientX
    if (endX == null) return
    const dx = endX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
    if (dx > 0) goPrev()
    else goNext()
  }

  const navBtnCls =
    'absolute top-1/2 -translate-y-1/2 z-[187] flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/50 text-white border border-white/20 backdrop-blur-sm touch-manipulation'

  return (
    <div
      className="fixed inset-0 z-[185] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ampliada: ${productName}`}
    >
      <button
        type="button"
        aria-label="Fechar visualização"
        className="absolute inset-0 bg-black/85 touch-manipulation"
        onClick={onClose}
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute z-[187] flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/50 text-white border border-white/25 backdrop-blur-sm touch-manipulation"
        style={{
          top:  'max(1rem, env(safe-area-inset-top, 0px))',
          right: 'max(1rem, env(safe-area-inset-right, 0px))',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {multi && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            className={`${navBtnCls} left-2 sm:left-4`}
            style={{ marginLeft: 'env(safe-area-inset-left, 0px)' }}
            onClick={e => {
              e.stopPropagation()
              goPrev()
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            className={`${navBtnCls} right-2 sm:right-4`}
            style={{ marginRight: 'env(safe-area-inset-right, 0px)' }}
            onClick={e => {
              e.stopPropagation()
              goNext()
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      <div
        className="relative z-[186] flex flex-col items-center max-w-[calc(100vw-24px)] max-h-[calc(100dvh-32px)] min-w-0"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={photos[index]}
          alt={productName}
          className="max-w-full max-h-[calc(100dvh-96px)] w-auto h-auto object-contain rounded-lg select-none"
          draggable={false}
        />
        {multi && (
          <p className="mt-3 text-sm text-white/80 tabular-nums" aria-live="polite">
            {index + 1} / {photos.length}
          </p>
        )}
      </div>
    </div>
  )
}
