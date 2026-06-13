'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { CustomCategory } from '@/types'
import {
  resolveFilterEmoji,
  resolveFilterImageUrl,
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
  storeSlug,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

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
  const isCircles = categoryNavStyle === 'circles'

  const scrollWrap = isCircles ? 'category-nav-circles-scroll' : 'category-nav-pills-scroll'

  return (
    <div className={`min-w-0 w-full ${scrollWrap}`} ref={scrollRef}>
      <div
        className={
          isCircles
            ? 'category-nav-circles-track'
            : 'flex gap-2 w-max min-w-full'
        }
        role="tablist"
        aria-label="Filtrar por categoria"
      >
        {filters.map(filter => {
          const isActive = filter.value === activeValue
          const emoji = resolveFilterEmoji(filter.value, filter.label, customCategories)
          const imageUrl = resolveFilterImageUrl(filter.value, customCategories)

          if (isCircles) {
            const inner = (
              <>
                <div
                  className={`category-nav-circle ${isActive ? 'active' : ''}`}
                >
                  <CategoryNavIcon
                    value={filter.value}
                    emoji={emoji}
                    imageUrl={imageUrl}
                    size="circle"
                  />
                </div>
                <span
                  className={`category-nav-circle-label ${isActive ? 'active' : ''}`}
                  title={filter.label}
                >
                  {filter.label}
                </span>
              </>
            )

            const className = 'category-nav-circle-item shrink-0 flex flex-col items-center gap-2 group'

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
            <>
              <CategoryNavIcon
                value={filter.value}
                emoji={emoji}
                imageUrl={imageUrl}
                size="pill"
              />
              <span className="truncate max-w-[9rem] sm:max-w-[12rem]" title={filter.label}>
                {filter.label}
              </span>
            </>
          )

          const pillClass = `filter-chip shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 font-medium transition-all touch-manipulation ${
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
