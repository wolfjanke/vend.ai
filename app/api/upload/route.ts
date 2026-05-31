import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logServerError } from '@/lib/logger'
import crypto from 'crypto'

function cloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
  return crypto.createHash('sha1').update(sorted + apiSecret).digest('hex')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey    = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Upload indisponível. Configure Cloudinary no servidor.' },
      { status: 503 },
    )
  }

  try {
    const { base64 } = await req.json()
    if (!base64 || typeof base64 !== 'string') {
      return NextResponse.json({ error: 'Imagem inválida' }, { status: 400 })
    }

    const folder = `vendai/${session.storeId}/products`
    const timestamp = Math.floor(Date.now() / 1000).toString()

    const signParams: Record<string, string> = {
      folder,
      timestamp,
    }
    const signature = cloudinarySignature(signParams, apiSecret)

    const formData = new FormData()
    formData.append('file', base64)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp)
    formData.append('signature', signature)
    formData.append('folder', folder)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData },
    )
    const data = await res.json()

    if (!res.ok) throw new Error(data.error?.message ?? 'Upload falhou')
    return NextResponse.json({ url: data.secure_url })
  } catch (error) {
    logServerError('[POST /api/upload]', error)
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
  }
}
