import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
import { sendEmail } from '@/lib/email'

type Ctx = { params: { id: string } }

export async function POST(_req: Request, { params }: Ctx) {
  const { error } = await requireSuperadmin()
  if (error) return error

  try {
    const rows = await sql`
      SELECT s.name, s.slug, COALESCE(s.owner_email, u.email) AS email
      FROM stores s
      LEFT JOIN admin_users u ON u.store_id = s.id
      WHERE s.id = ${params.id}
      LIMIT 1
    `
    const row = rows[0]
    if (!row?.email) {
      return NextResponse.json({ error: 'E-mail do lojista não encontrado' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendai.club'
    const result = await sendEmail({
      to:      row.email as string,
      subject: `${row.name} — ative sua loja no vend.ai`,
      html: `
        <p>Olá!</p>
        <p>Sua loja <strong>${row.name}</strong> está quase pronta.</p>
        <p>Acesse o painel e cadastre produtos para começar a vender:</p>
        <p><a href="${appUrl}/admin">${appUrl}/admin</a></p>
        <p>Vitrine: <a href="${appUrl}/${row.slug}">${appUrl}/${row.slug}</a></p>
      `,
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Falha ao enviar e-mail' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[superadmin/email]', e)
    return NextResponse.json({ error: 'Falha ao enviar e-mail' }, { status: 500 })
  }
}
