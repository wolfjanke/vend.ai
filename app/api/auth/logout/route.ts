import { NextResponse } from 'next/server'
export { dynamic } from '@/lib/route-dynamic'


// Redireciona para o signout do NextAuth
export async function POST() {
  return NextResponse.redirect(
    new URL('/api/auth/signout', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
    { status: 302 }
  )
}
