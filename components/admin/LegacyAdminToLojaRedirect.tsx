'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { LojaSectionId } from '@/lib/admin-loja-sections'
import { resolveLegacyLojaSection } from '@/lib/admin-loja-legacy'
import { lojaSectionHref } from '@/lib/admin-loja-sections'

type Props = {
  defaultSection: LojaSectionId
}

export default function LegacyAdminToLojaRedirect({ defaultSection }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    const secao = searchParams.get('secao')
    const hash = window.location.hash.replace(/^#/, '')
    const resolved = resolveLegacyLojaSection(tab ?? secao ?? hash, defaultSection)
    router.replace(lojaSectionHref(resolved))
  }, [searchParams, defaultSection, router])

  return (
    <p className="text-sm text-muted animate-pulse py-8 text-center" role="status">
      Redirecionando…
    </p>
  )
}
