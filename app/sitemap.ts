import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { BASE_URL } from '@/lib/metadata'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = BASE_URL

  try {
    // 1. Ambil semua kategori aktif
    const categories = await prisma.category.findMany({
      select: { 
        slug: true, 
        updatedAt: true 
      }
    })

    // 2. Ambil semua produk aktif
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { 
        slug: true, 
        updatedAt: true 
      }
    })

    // 3. Rute statis dasar
    const routes = [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
      { url: `${baseUrl}/produk`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
      { url: `${baseUrl}/mix-and-match`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${baseUrl}/tentang`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: `${baseUrl}/kontak`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
      { url: `${baseUrl}/wishlist`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.3 },
    ]

    // 4. Map kategori
    const categoryUrls = categories.map((c) => ({
      url: `${baseUrl}/kategori/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // 5. Map produk
    const productUrls = products.map((p) => ({
      url: `${baseUrl}/produk/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...routes, ...categoryUrls, ...productUrls]
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error)
    // Fallback minimal jika database error agar tidak merusak sitemap.xml
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 }
    ]
  }
}
