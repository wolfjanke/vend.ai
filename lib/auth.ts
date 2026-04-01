import { getServerSession, type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { sql } from './db'

/** NextAuth aceita NEXTAUTH_SECRET ou AUTH_SECRET (alguns hosts documentam só um dos nomes). */
function authSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
}

if (process.env.NODE_ENV === 'production' && !authSecret()) {
  console.error(
    '[auth] Defina NEXTAUTH_SECRET (ou AUTH_SECRET) nas variáveis de ambiente de produção — sem isso o login devolve erro de configuração.'
  )
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

          return {
            id:      user.id as string,
            email:   user.email as string,
            storeId: user.store_id as string,
          }
        } catch (e) {
          console.error('[auth] authorize (banco ou bcrypt):', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.storeId = (user as { id: string; email: string; storeId: string }).storeId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id      = token.sub!
        session.storeId      = token.storeId as string
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
