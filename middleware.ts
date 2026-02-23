export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/admin/dashboard',
    '/admin/pedidos',
    '/admin/pedidos/:path*',
    '/admin/produtos',
    '/admin/produtos/:path*',
    '/admin/configuracoes',
  ],
}
