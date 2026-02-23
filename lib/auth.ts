import { getServerSession, type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { sql } from './db'

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

        const rows = await sql`
          SELECT id, email, password_hash, store_id
          FROM admin_users
          WHERE email = ${credentials.email}
          LIMIT 1
        `
        const user = rows[0]
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.password_hash as string)
        if (!valid) return null

        return {
          id:      user.id as string,
          email:   user.email as string,
          storeId: user.store_id as string,
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
  secret: process.env.NEXTAUTH_SECRET,
}

export const getSession = () => getServerSession(authOptions)
