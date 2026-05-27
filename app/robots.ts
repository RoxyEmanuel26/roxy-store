import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const envUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://www.roxystore.web.id'
  const baseUrl = envUrl.startsWith('http') ? envUrl : `https://${envUrl}`

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/offline'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
