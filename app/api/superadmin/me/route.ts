import { NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/superadmin'
export { dynamic } from '@/lib/route-dynamic'


export async function GET() {
  const { session, error } = await requireSuperadmin()
  if (error) return error
  return NextResponse.json({
    email: session!.user.email,
    id:    session!.user.id,
  })
}
