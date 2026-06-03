import { NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/superadmin'

export async function POST() {
  const { error } = await requireSuperadmin()
  if (error) return error
  return NextResponse.json({ ok: true, stopImpersonation: true })
}
