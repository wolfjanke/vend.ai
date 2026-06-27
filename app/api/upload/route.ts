import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logServerError } from '@/lib/logger'
import { isCloudinaryConfigured } from '@/lib/cloudinary'
import { checkUploadPostRateLimit } from '@/lib/store-rate-limit'
import crypto from 'crypto'
export { dynamic } from '@/lib/route-dynamic'


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

  if (!(await checkUploadPostRateLimit(session.storeId))) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde e tente novamente.' },
      { status: 429 },
    )
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: 'cloudinary_not_configured' },
      { status: 503 },
    )
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiKey    = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!

  try {
    const contentType = req.headers.get('content-type') ?? ''
    let base64: string
    let purpose: 'logo' | 'categoria' = 'logo'

    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData()
      const file = fd.get('file') as File | null
      if (!file) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
      const arrayBuffer = await file.arrayBuffer()
      const b64 = Buffer.from(arrayBuffer).toString('base64')
      base64 = `data:${file.type || 'image/png'};base64,${b64}`
      const rawPurpose = String(fd.get('purpose') ?? 'logo').trim()
      purpose = rawPurpose === 'categoria' ? 'categoria' : 'logo'
    } else {
      const body = await req.json() as { base64?: string; purpose?: string }
      base64 = body.base64 ?? ''
      purpose = body.purpose === 'categoria' ? 'categoria' : 'logo'
    }

    if (!base64) {
      return NextResponse.json({ error: 'Imagem inválida' }, { status: 400 })
    }

    const folder =
      purpose === 'categoria'
        ? `vendai/${session.storeId}/categorias`
        : `vendai/${session.storeId}/logos`
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
