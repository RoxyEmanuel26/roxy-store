import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

/**
 * Cache product by slug — dipakai di generateMetadata & ProductDetailPage
 * Eliminasi double DB query untuk setiap page visit.
 */
export const getCachedProductBySlug = (slug: string) =>
    unstable_cache(
        async () => {
            return prisma.product.findUnique({
                where: { slug, isActive: true },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    price: true,
                    originalPrice: true,
                    image: true,
                    images: true,
                    shopeeUrl: true,
                    shopeeRating: true,
                    shopeeSold: true,
                    badge: true,
                    viewCount: true,
                    shopeeClicks: true,
                    categoryId: true,
                    category: { select: { id: true, name: true, slug: true } },
                },
            })
        },
        [`product-slug-${slug}`],
        { revalidate: 60, tags: ['products', `product-${slug}`] }
    )()

export const getCachedCategories = unstable_cache(
    async () => {
        return prisma.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        })
    },
    ['categories-list'],
    { revalidate: 3600, tags: ['categories'] } // Cache for 1 hour, invalidate via tag
)

export const getCachedFeaturedProducts = unstable_cache(
    async () => {
        return prisma.product.findMany({
            where: { isActive: true, badge: { in: ['HOT', 'BEST SELLER'] } },
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                image: true,
                badge: true,
                viewCount: true,
                category: { select: { name: true, slug: true } },
            },
            orderBy: { viewCount: 'desc' },
            take: 8,
        })
    },
    ['featured-products'],
    { revalidate: 3600, tags: ['products'] }
)

export const getCachedNewProducts = unstable_cache(
    async () => {
        return prisma.product.findMany({
            where: { isActive: true, badge: 'NEW' },
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                image: true,
                badge: true,
                viewCount: true,
                category: { select: { name: true, slug: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 8,
        })
    },
    ['new-products'],
    { revalidate: 3600, tags: ['products'] }
)

export const getCachedProductCount = unstable_cache(
    async () => {
        return prisma.product.count({ where: { isActive: true } })
    },
    ['product-count-active'],
    { revalidate: 3600, tags: ['products'] }
)
