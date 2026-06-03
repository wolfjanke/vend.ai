import { NextResponse } from 'next/server'
import { isCloudinaryConfigured } from '@/lib/cloudinary'
export { dynamic } from '@/lib/route-dynamic'


export async function GET() {
  return NextResponse.json({ configured: isCloudinaryConfigured() })
}
