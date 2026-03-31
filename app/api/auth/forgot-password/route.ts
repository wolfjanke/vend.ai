import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: true })
    }
    const email = parsed.data.email.toLowerCase().trim()

    const rows = await sql`SELECT id FROM admin_users WHERE email = ${email} LIMIT 1`
    const user = rows[0] as { id: string } | undefined

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 60 * 60 * 1000)

      await sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`
      await sql`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (${user.id}, ${token}, ${expires.toISOString()})
      `

      const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const resetUrl = `${base.replace(/\/$/, '')}/redefinir-senha?token=${encodeURIComponent(token)}`
      await sendPasswordResetEmail(email, resetUrl)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[forgot-password]', e)
    return NextResponse.json({ ok: true })
  }
}
