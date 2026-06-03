import { getServerSession, type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { sql } from './db'
import { isSuperadminEmail } from './superadmin-allowlist'

/** NextAuth aceita NEXTAUTH_SECRET ou AUTH_SECRET (alguns hosts documentam só um dos nomes). */
function authSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
}

if (process.env.NODE_ENV === 'production' && !authSecret()) {
  console.error(
    '[auth] Defina NEXTAUTH_SECRET (ou AUTH_SECRET) nas variáveis de ambiente de produção — sem isso o login devolve erro de configuração.'
  )
}

async function touchStoreLogin(storeId: string, email: string | null | undefined) {
  try {
    await sql`
      UPDATE stores
      SET last_login_at = NOW(),
          owner_email = COALESCE(owner_email, ${email ?? null})
      WHERE id = ${storeId}
    `
  } catch (e) {
    console.error('[auth] touchStoreLogin:', e)
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',  type: 'email'    },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const rows = await sql`
            SELECT id, email, password_hash, store_id
            FROM admin_users
            WHERE email = ${credentials.email}
            LIMIT 1
          `
          const user = rows[0]
          if (!user) return null
          const hash = user.password_hash as string | null
          if (!hash) return null

          const valid = await bcrypt.compare(credentials.password, hash)
          if (!valid) return null

          const storeId = user.store_id as string
          if (storeId) {
            await touchStoreLogin(storeId, user.email as string)
          }

          return {
            id:      user.id as string,
            email:   user.email as string,
            storeId,
          }
        } catch (e) {
          console.error('[auth] authorize (banco ou bcrypt):', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as { id: string; email: string; storeId: string }
        token.storeId = u.storeId
        token.email = u.email
        token.impersonating = false
        token.realStoreId = undefined
      }

      if (trigger === 'update' && session) {
        const s = session as {
          impersonateStoreId?: string
          stopImpersonation?: boolean
        }
        const email = (token.email as string) ?? ''

        if (s.stopImpersonation && isSuperadminEmail(email)) {
          if (token.realStoreId) {
            token.storeId = token.realStoreId as string
          }
          token.impersonating = false
          token.realStoreId = undefined
        } else if (s.impersonateStoreId && isSuperadminEmail(email)) {
          if (!token.impersonating) {
            token.realStoreId = token.storeId as string
          }
          token.storeId = s.impersonateStoreId
          token.impersonating = true
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        if (token.email) {
          session.user.email = token.email as string
        }
        session.storeId = token.storeId as string
        session.impersonating = Boolean(token.impersonating)
        if (token.realStoreId) {
          session.realStoreId = token.realStoreId as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/admin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: authSecret(),
}

export const getSession = () => getServerSession(authOptions)

/** Para layouts RSC: nunca lança — evita página 500 em /admin se JWT/secret estiver inconsistente. */
export async function getSessionSafe() {
  try {
    return await getServerSession(authOptions)
  } catch (e) {
    console.error('[next-auth] getServerSession:', e)
    return null
  }
}
