'use client'

import { useCallback, useEffect, useState } from 'react'

export function useRetentionPendingCount(refreshKey?: string | number) {
  const [pending, setPending] = useState(0)

  const refresh = useCallback(() => {
    fetch('/api/superadmin/retencao/count')
      .then(r => r.json())
      .then(d => setPending(Number(d.pending ?? 0)))
      .catch(() => setPending(0))
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('retention-queue-updated', refresh)
    return () => window.removeEventListener('retention-queue-updated', refresh)
  }, [refresh, refreshKey])

  return pending
}
