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
      { error: 'cloudinary_not_configured' },
      { status: 503 },
    )
  }

  try {
    const contentType = req.headers.get('content-type') ?? ''
    let base64: string

    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData()
      const file = fd.get('file') as File | null
      if (!file) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
      const arrayBuffer = await file.arrayBuffer()
      const b64 = Buffer.from(arrayBuffer).toString('base64')
      base64 = `data:${file.type || 'image/png'};base64,${b64}`
    } else {
      const body = await req.json() as { base64?: string }
      base64 = body.base64 ?? ''
    }

    if (!base64) {
      return NextResponse.json({ error: 'Imagem inválida' }, { status: 400 })
    }

    const folder = `vendai/${session.storeId}/logos`
    const timestamp = Math.floor(Date.now() / 1000).toString()

    const signParams: Record<string, string> = { folder, timestamp }
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
    const data = await res.json() as { secure_url?: string; error?: { message?: string } }

    if (!res.ok) throw new Error(data.error?.message ?? 'Upload falhou')
    return NextResponse.json({ url: data.secure_url })
  } catch (error) {
    logServerError('[POST /api/upload]', error)
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
  }
}
