/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      /** Pedidos legados a `.ico` servem o SVG em `public/favicon.svg`. */
      { source: '/favicon.ico', destination: '/favicon.svg' },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
