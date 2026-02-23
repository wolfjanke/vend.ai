import 'next-auth'

declare module 'next-auth' {
  interface Session {
    storeId: string
    user: {
      id:    string
      email: string
      name?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    storeId: string
  }
}
