'use client'

import Image from 'next/image'
import {
  Baby,
  Percent,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  '':        Sparkles,
  vestido:   Shirt,
  blusa:     Shirt,
  camiseta:  Shirt,
  calca:     ShoppingBag,
  bermuda:   ShoppingBag,
  shorts:    ShoppingBag,
  conjunto:  Sparkles,
  saia:      Shirt,
  moletom:   ShoppingBag,
  casaco:    ShoppingBag,
  infantil:  Baby,
  outro:     Tag,
  sale:      Percent,
}

function getCategoryIcon(slug: string): LucideIcon {
  const key = String(slug ?? '').trim()
  return ICON_MAP[key] ?? Tag
}

interface Props {
  value:    string
  emoji:    string
  imageUrl: string | null
  size:     'pill' | 'circle'
}

export default function CategoryNavIcon({ value, emoji, imageUrl, size }: Props) {
  const dim = size === 'circle' ? 64 : 20

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={dim}
        height={dim}
        className={
          size === 'circle'
            ? 'w-full h-full object-cover'
            : 'w-5 h-5 shrink-0 rounded-full object-cover'
        }
        unoptimized
      />
    )
  }

  if (emoji) {
    return (
      <span
        className={size === 'circle' ? 'text-2xl leading-none' : 'text-base leading-none shrink-0'}
        aria-hidden
      >
        {emoji}
      </span>
    )
  }

  const Icon = getCategoryIcon(value)
  const iconSize = size === 'circle' ? 24 : 14
  return (
    <Icon
      size={iconSize}
      className={size === 'circle' ? 'text-[var(--theme-chip-text)]' : 'shrink-0'}
      strokeWidth={1.5}
      aria-hidden
    />
  )
}
