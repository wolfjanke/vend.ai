'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { CustomCategory } from '@/types'
import {
  resolveFilterImageUrl,
  formatCategoryLabel,
  type CategoryNavStyle,
} from '@/lib/category-nav'
import CategoryNavIcon from './CategoryNavIcon'

export type CategoryFilter = { value: string; label: string }

interface Props {
  filters:           CategoryFilter[]
  activeValue:       string
  onSelect:          (value: string) => void
  customCategories?: CustomCategory[]
  categoryNavStyle?: CategoryNavStyle
  /** Preview admin: só texto, sem ícones/emojis */
  textOnly?:          boolean
  /** Quando definido, chips viram links compartilháveis. */
  storeSlug?:        string
}

function categoryHref(storeSlug: string, value: string): string {
  if (!value) return `/${storeSlug}`
  return `/${storeSlug}/categoria/${encodeURIComponent(value)}`
}

export default function CategoryFilterBar({
  filters,
  activeValue,
  onSelect,
  customCategories = [],
  categoryNavStyle = 'pills',
  textOnly = false,
  storeSlug,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)
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
    root.addEventListener('scroll', updateScrollEnd, { passive: true })
    return () => {
      ro.disconnect()
      root.removeEventListener('scroll', updateScrollEnd)
    }
  }, [filters, categoryNavStyle, textOnly])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      if (!activeValue) return
    }
    const root = scrollRef.current
    if (!root) return
    const active = root.querySelector<HTMLElement>(`[data-filter-value="${CSS.escape(activeValue)}"]`)
    if (!active) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    active.scrollIntoView({
      inline:      'nearest',
      block:       'nearest',
      behavior:    reduced ? 'auto' : 'smooth',
    })
  }, [activeValue, filters])

  if (filters.length === 0) return null

  const useLinks = Boolean(storeSlug)
  const isCircles = !textOnly && categoryNavStyle === 'circles'

  const scrollWrap = isCircles ? 'category-nav-circles-scroll' : 'category-nav-pills-scroll'
  const isScrollable = layoutMode === 'overflow'
  const showScrollHint = isScrollable && !atScrollEnd

  const pillTrack = 'category-nav-pills-track flex gap-2 w-max md:min-w-full'
  const trackAlign =
    layoutMode === 'fit' ? 'md:justify-center max-md:justify-start' : 'justify-start'
  const trackWrap = layoutMode === 'fit' ? 'md:flex-wrap' : ''
  const scrollSnap = isScrollable ? 'snap-x snap-mandatory overscroll-x-contain touch-pan-x' : ''
  const itemSnap = isScrollable ? 'snap-start' : ''

  return (
    <div
      className={`min-w-0 w-full ${scrollWrap} ${scrollSnap} ${showScrollHint ? 'category-nav-scroll--overflow' : ''}`}
      ref={scrollRef}
    >
      <div
        className={
          isCircles
            ? `category-nav-circles-track ${trackAlign} ${trackWrap}`
            : `${pillTrack} ${trackAlign} ${trackWrap}`
        }
        role="tablist"
        aria-label="Filtrar por categoria"
      >
        {filters.map(filter => {
          const isActive = filter.value === activeValue
          const displayLabel = formatCategoryLabel(filter.label)
          const imageUrl = resolveFilterImageUrl(filter.value, customCategories)

          if (isCircles) {
            const inner = (
              <>
                <div
                  className={`category-nav-circle ${isActive ? 'active' : ''}`}
                >
                  <CategoryNavIcon
                    value={filter.value}
                    imageUrl={imageUrl}
                    size="circle"
                  />
                </div>
                <span
                  className={`category-nav-circle-label ${isActive ? 'active' : ''}`}
                  title={displayLabel}
                >
                  {displayLabel}
                </span>
              </>
            )

            const className = `category-nav-circle-item shrink-0 flex flex-col items-center gap-2 group ${itemSnap}`

            if (useLinks && storeSlug) {
              return (
                <Link
                  key={filter.value || '__all'}
                  href={categoryHref(storeSlug, filter.value)}
                  data-filter-value={filter.value}
                  role="tab"
                  aria-selected={isActive}
                  className={className}
                  onClick={() => onSelect(filter.value)}
                >
                  {inner}
                </Link>
              )
            }

            return (
              <button
                key={filter.value || '__all'}
                type="button"
                data-filter-value={filter.value}
                role="tab"
                aria-selected={isActive}
                className={className}
                onClick={() => onSelect(filter.value)}
              >
                {inner}
              </button>
            )
          }

          const pillInner = (
            <span className="truncate max-w-[9rem] sm:max-w-[12rem]" title={displayLabel}>
              {displayLabel}
            </span>
          )

          const pillClass = `filter-chip shrink-0 inline-flex items-center min-h-[44px] px-3.5 py-2 font-medium transition-all touch-manipulation ${itemSnap} ${
            isActive ? 'active' : ''
          }`

          if (useLinks && storeSlug) {
            return (
              <Link
                key={filter.value || '__all'}
                href={categoryHref(storeSlug, filter.value)}
                data-filter-value={filter.value}
                role="tab"
                aria-selected={isActive}
                className={pillClass}
                onClick={() => onSelect(filter.value)}
              >
                {pillInner}
              </Link>
            )
          }

          return (
            <button
              key={filter.value || '__all'}
              type="button"
              data-filter-value={filter.value}
              role="tab"
              aria-selected={isActive}
              aria-pressed={isActive}
              className={pillClass}
              onClick={() => onSelect(filter.value)}
            >
              {pillInner}
            </button>
          )
        })}
      </div>
    </div>
  )
}
