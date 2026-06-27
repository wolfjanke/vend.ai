import { getServerSession, type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { sql } from './db'
import { authenticateAdminUser, isAdminEmailVerified } from './authenticate-admin'
import { checkLoginRateLimit } from './auth-rate-limit'
import { logLoginRateLimitBlocked } from './auth-login-log'
import { isSuperadminEmail } from './superadmin-allowlist'
import { resolveGoogleSignIn } from './google-auth'

/** NextAuth aceita NEXTAUTH_SECRET ou AUTH_SECRET (alguns hosts documentam só um dos nomes). */
function authSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
}

function googleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

if (process.env.NODE_ENV === 'production' && !authSecret()) {
  console.error(
    '[auth] Defina NEXTAUTH_SECRET (ou AUTH_SECRET) nas variáveis de ambiente de produção — sem isso o login devolve erro de configuração.'
  )
}

type AuthorizeRequest = {
  headers?: Record<string, string | string[] | undefined>
}

function ipFromAuthorizeRequest(req: AuthorizeRequest | undefined): string {
  const forwarded = req?.headers?.['x-forwarded-for']
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return (
    first?.split(',')[0]?.trim() ??
    (req?.headers?.['x-real-ip'] as string | undefined) ??
    'unknown'
  )
}

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email:    { label: 'Email',  type: 'email'    },
      password: { label: 'Senha', type: 'password' },
    },
    async authorize(credentials, req) {
      if (!credentials?.email || !credentials?.password) return null

      const ip = ipFromAuthorizeRequest(req as AuthorizeRequest | undefined)
      if (!(await checkLoginRateLimit(ip, credentials.email))) {
        logLoginRateLimitBlocked(ip, credentials.email)
        throw new Error('RATE_LIMITED')
      }

      try {
        const user = await authenticateAdminUser(credentials.email, credentials.password)
        if (!user) return null
        if (!(await isAdminEmailVerified(user.id))) {
          throw new Error('EMAIL_NOT_VERIFIED')
        }
        return user
      } catch (e) {
        if (e instanceof Error && e.message === 'EMAIL_NOT_VERIFIED') throw e
        console.error('[auth] authorize:', e)
        return null
      }
    },
  }),
]

if (googleAuthConfigured()) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: 'select_account' } },
    }),
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true
      if (!profile?.email) return false

      try {
        await resolveGoogleSignIn({
          googleId: account.providerAccountId,
          email: profile.email,
          name: profile.name,
        })
        return true
      } catch (e) {
        console.error('[auth] google signIn:', e)
        return false
      }
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          const admin = await resolveGoogleSignIn({
            googleId: account.providerAccountId,
            email: profile.email,
            name: profile.name,
          })
          token.sub = admin.id
          token.email = admin.email
          token.storeId = admin.storeId ?? ''
          token.impersonating = false
          token.realStoreId = undefined
          token.sessionRevoked = false
        } catch (e) {
          console.error('[auth] jwt google:', e)
        }
      } else if (user) {
        const u = user as { id: string; email: string; storeId: string }
        token.storeId = u.storeId
        token.email = u.email
        token.impersonating = false
        token.realStoreId = undefined
        token.sessionRevoked = false
      }

      if (token.sub && !user && !account && !token.sessionRevoked) {
        try {
          const rows = await sql`
            SELECT password_changed_at FROM admin_users WHERE id = ${token.sub} LIMIT 1
          `
          const changedAt = rows[0]?.password_changed_at as string | Date | undefined
          if (changedAt && token.iat) {
            const changedMs = new Date(changedAt).getTime()
            const issuedMs = (token.iat as number) * 1000
            if (changedMs > issuedMs) {
              token.sessionRevoked = true
            }
          }
        } catch (e) {
          console.error('[auth] jwt password_changed_at:', e)
        }
      }

      if (trigger === 'update' && session) {
        const s = session as {
          impersonateStoreId?: string
          stopImpersonation?: boolean
          refreshStore?: boolean
        }
        const email = (token.email as string) ?? ''

        if (s.refreshStore && token.sub) {
          try {
            const rows = await sql`
              SELECT store_id FROM admin_users WHERE id = ${token.sub} LIMIT 1
            `
            const storeId = rows[0]?.store_id as string | null | undefined
            if (storeId) token.storeId = storeId
          } catch (e) {
            console.error('[auth] jwt refreshStore:', e)
          }
        }

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
      if (token.sessionRevoked) {
        return {
          expires: new Date(0).toISOString(),
          user: { id: '', email: '' },
          storeId: '',
        }
      }

      if (token) {
        session.user.id = token.sub!
        if (token.email) {
          session.user.email = token.email as string
        }
        session.storeId = (token.storeId as string) ?? ''
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
    error: '/admin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
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

export { googleAuthConfigured }
