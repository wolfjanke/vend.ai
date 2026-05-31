'use client'

import { createContext, useContext } from 'react'
import type { CartItem, Product, Store, StoreContext } from '@/types'
import type { StoreThemeConfig } from '@/lib/themes'
import type { PlanSlug } from '@/lib/plans'

export type LojaContextValue = {
  store:           Store
  products:        Product[]
  cardTheme:       StoreThemeConfig
  plan:            PlanSlug
  storeContext:    StoreContext
  cart:            CartItem[]
  cartOpen:        boolean
  setCartOpen:     (open: boolean) => void
  addToCart:       (item: CartItem) => void
  viOpen:          boolean
  setViOpen:       (open: boolean) => void
  openViWithMessage: (content: string) => void
  onProductFocus:  (product: Product) => void
  baseUrl:         string
}

const LojaContext = createContext<LojaContextValue | null>(null)

export function LojaProvider({
  value,
  children,
}: {
  value:    LojaContextValue
  children: React.ReactNode
}) {
  return <LojaContext.Provider value={value}>{children}</LojaContext.Provider>
}

export function useLoja(): LojaContextValue {
  const ctx = useContext(LojaContext)
  if (!ctx) throw new Error('useLoja must be used within LojaProvider')
  return ctx
}
