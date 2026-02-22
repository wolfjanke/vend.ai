import { createClient }  from '@/lib/supabase'
import { NextResponse }  from 'next/server'

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
}
