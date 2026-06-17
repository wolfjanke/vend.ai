'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Store, CustomCategory, StoreSettings } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import {
  parseLojaSection,
  lojaSectionToConfigSection,
  lojaSectionLabel,
  lojaSectionDescription,
  type LojaSectionId,
} from '@/lib/admin-loja-sections'
import { adminHeader } from '@/lib/admin-ui'
import LojaSectionNav from '@/components/admin/LojaSectionNav'
import ConfigForm from '@/app/admin/configuracoes/ConfigForm'
import AparenciaClient from '@/app/admin/aparencia/AparenciaClient'
import MarketingForm from '@/app/admin/marketing/MarketingForm'
import type { StorePreviewProduct } from '@/lib/preview-products'

type ViStats = {
  used:      number
  limit:     number
  overage:   number
  daysReset: number
}

export type AparenciaInitial = {
  theme_name:            string
  theme_primary_color:   string | null
  theme_secondary_color: string | null
  theme_accent_color:    string | null
  theme_background:      'light' | 'dark'
  theme_shimmer:         boolean
}

export type VitrineSettings = Pick<
  StoreSettings,
  'headerLayout' | 'logoShape' | 'brandDisplay' | 'showSearch' | 'logoSize' | 'mobileGridCols'
>

type Props = {
  store:                  Store
  plan:                   PlanSlug
  viStats:                ViStats
  checkoutEligible:       boolean
  checkoutLaunchEnabled:  boolean
  displayLogo:            string | null
  previewProducts:        StorePreviewProduct[]
  aparenciaInitial:       AparenciaInitial
  vitrineSettings:        VitrineSettings
  categoryNavStyle:       'pills' | 'circles'
  customCategories:       CustomCategory[]
}

export default function LojaClient({
  store,
  plan,
  viStats,
  checkoutEligible,
  checkoutLaunchEnabled,
  displayLogo,
  previewProducts,
  aparenciaInitial,
  vitrineSettings,
  categoryNavStyle,
  customCategories,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const secao = parseLojaSection(searchParams.get('secao'))
  const configSection = lojaSectionToConfigSection(secao)
  const sectionLabel = lojaSectionLabel(secao)

  useEffect(() => {
    document.title = `${sectionLabel} — Minha loja | vendai.club`
  }, [sectionLabel])

  function onSectionChange(id: LojaSectionId) {
    router.push(`/admin/loja?secao=${id}`, { scroll: false })
  }

  return (
    <>
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1 break-words">
          {sectionLabel}
          <span className="text-muted font-semibold text-base sm:text-lg"> — Minha loja</span>
        </h1>
        <p className="text-sm text-muted break-words">
          {lojaSectionDescription(secao)}
        </p>
      </div>

      <LojaSectionNav active={secao} onChange={onSectionChange} />

      {secao === 'visual' && (
        <AparenciaClient
          slug={store.slug}
          plan={plan}
          storeName={store.name}
          logoUrl={displayLogo}
          products={previewProducts}
          assistantName={store.assistant_name?.trim() || 'Vi'}
          tagline={store.tagline ?? null}
          categoryNavStyle={categoryNavStyle}
          customCategories={customCategories}
          vitrineSettings={vitrineSettings}
          initial={aparenciaInitial}
        />
      )}

      {secao === 'promocoes' && (
        <MarketingForm store={store} checkoutLaunchEnabled={checkoutLaunchEnabled} />
      )}

      {configSection && (
        <ConfigForm
          store={store}
          viStats={viStats}
          checkoutEligible={checkoutEligible}
          checkoutLaunchEnabled={checkoutLaunchEnabled}
          embeddedSection={configSection}
        />
      )}
    </>
  )
}
