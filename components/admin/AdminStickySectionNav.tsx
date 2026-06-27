'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  ariaLabel:  string
  activeKey?: string
  children:   ReactNode
}

export default function AdminStickySectionNav({ ariaLabel, activeKey, children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [layoutMode, setLayoutMode] = useState<'unknown' | 'overflow' | 'fit'>('unknown')
  const [atScrollEnd, setAtScrollEnd] = useState(false)

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const track = root.firstElementChild as HTMLElement | null
    if (!track) return

    const updateScrollEnd = () => {
      setAtScrollEnd(root.scrollLeft + root.clientWidth >= root.scrollWidth - 2)
    }

    const updateOverflow = () => {
      setLayoutMode(root.scrollWidth > root.clientWidth + 1 ? 'overflow' : 'fit')
      updateScrollEnd()
    }

    updateOverflow()
    const ro = new ResizeObserver(updateOverflow)
    ro.observe(root)
    ro.observe(track)
    const mo = new MutationObserver(updateOverflow)
    mo.observe(track, { childList: true, subtree: true, attributes: true })
    root.addEventListener('scroll', updateScrollEnd, { passive: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
      root.removeEventListener('scroll', updateScrollEnd)
    }
  }, [])

  useEffect(() => {
    if (!activeKey) return
    const root = scrollRef.current
    if (!root) return
    const active = root.querySelector<HTMLElement>(`[data-nav-key="${CSS.escape(activeKey)}"]`)
    if (!active) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    active.scrollIntoView({
      inline:   'nearest',
      block:    'nearest',
      behavior: reduced ? 'auto' : 'smooth',
    })
  }, [activeKey])

  const isScrollable = layoutMode === 'overflow'
  const showScrollHint = isScrollable && !atScrollEnd
  const trackAlign =
    layoutMode === 'fit' ? 'md:justify-center max-md:justify-start' : 'justify-start'
  const trackWrap = layoutMode === 'fit' ? 'md:flex-wrap' : ''
  const scrollSnap = isScrollable
    ? 'snap-x snap-mandatory overscroll-x-contain touch-pan-x scroll-pl-1 scroll-pr-1'
    : ''

  return (
    <nav
      aria-label={ariaLabel}
      className="sticky top-16 z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8 py-2.5 mb-4 bg-bg border-b border-border min-w-0"
    >
      <div
        ref={scrollRef}
        className={`overflow-x-auto overflow-y-hidden min-w-0 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] ${scrollSnap} ${showScrollHint ? 'admin-nav-scroll--overflow' : ''}`}
      >
        <div className={`flex gap-2 w-max md:min-w-full ${trackAlign} ${trackWrap}`}>
          {children}
        </div>
      </div>
    </nav>
  )
}

export const adminSectionNavButtonClass = (isActive: boolean, extra = '') =>
  `shrink-0 snap-start min-h-[44px] px-4 rounded-full border text-sm font-semibold transition-colors ${extra} ${
    isActive
      ? 'border-primary bg-surface3 text-primary shadow-sm'
      : 'border-border bg-surface2 text-muted hover:border-primary/40 hover:text-foreground'
  }`.trim()
