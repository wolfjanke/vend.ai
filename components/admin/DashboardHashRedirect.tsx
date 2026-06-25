'use client'

import { useEffect } from 'react'
import { resolveLegacyLojaSection } from '@/lib/admin-loja-legacy'
import { lojaSectionHref } from '@/lib/admin-loja-sections'

const LEGACY_DASHBOARD_HASHES = new Set([
  'vi', 'conta', 'venda', 'loja', 'identidade',
  'config-loja', 'config-vi', 'config-venda', 'config-conta',
])

/** `/admin/dashboard#vi` e hashes legados → Minha loja (só no browser — hash não vai ao servidor). */
export default function DashboardHashRedirect() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '').toLowerCase()
    if (!hash || !LEGACY_DASHBOARD_HASHES.has(hash)) return
    window.location.replace(lojaSectionHref(resolveLegacyLojaSection(hash)))
  }, [])

  return null
}
