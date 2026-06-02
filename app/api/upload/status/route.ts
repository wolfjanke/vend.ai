import { NextResponse } from 'next/server'
import { isCloudinaryConfigured } from '@/lib/cloudinary'

export async function GET() {
  return NextResponse.json({ configured: isCloudinaryConfigured() })
}
