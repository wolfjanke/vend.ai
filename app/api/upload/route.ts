import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cloudName   = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey      = process.env.CLOUDINARY_API_KEY
  const apiSecret   = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    // Cloudinary não configurado — retornar URL base64 direta
    const { base64 } = await req.json()
    return NextResponse.json({ url: base64 })
  }

  try {
    const { base64 } = await req.json()

    const formData = new FormData()
    formData.append('file', base64)
    formData.append('upload_preset', 'vendai_products')
    formData.append('folder', `vendai/${session.storeId}`)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    )
    const data = await res.json()

    if (!res.ok) throw new Error(data.error?.message ?? 'Upload falhou')
    return NextResponse.json({ url: data.secure_url })
  } catch (error) {
    console.error('[POST /api/upload]', error)
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
  }
}
