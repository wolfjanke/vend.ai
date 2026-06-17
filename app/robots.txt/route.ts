import { siteUrl } from '@/lib/site-seo'

export function GET() {
  const origin = siteUrl()
  const body = `# llms.txt: ${siteUrl('/llms.txt')}

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /superadmin/
Disallow: /api/

Host: ${origin}
Sitemap: ${siteUrl('/sitemap.xml')}
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
