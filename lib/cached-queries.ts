import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { determineProductBadge } from '@/lib/badge'

/**
 * Cache product by slug — dipakai di generateMetadata & ProductDetailPage
 * Eliminasi double DB query untuk setiap page visit.
 */
export const getCachedProductBySlug = (slug: string) =>
    unstable_cache(
        async () => {
            const product = await prisma.product.findUnique({
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
                    shopeeRatingCountStr: true,
                    shopeeSoldStr: true,
                    badge: true,
                    viewCount: true,
                    createdAt: true,
                    shopeeClicks: true,
                    categoryId: true,
                    category: { select: { id: true, name: true, slug: true } },
                },
            })
            if (!product) return null
            return {
                ...product,
                badge: determineProductBadge(product)
            }
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
                icon: true,
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
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    { badge: 'HOT' },
                    { badge: 'NEW', createdAt: { lt: oneWeekAgo } },
                    { viewCount: { gt: 0 } }
                ]
            },
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                image: true,
                badge: true,
                viewCount: true,
                createdAt: true,
                category: { select: { name: true, slug: true } },
            },
            orderBy: { viewCount: 'desc' },
            take: 8,
        })
        return products.map(product => ({
            ...product,
            badge: determineProductBadge(product)
        }))
    },
    ['featured-products'],
    { revalidate: 60, tags: ['products'] }
)

export const getCachedNewProducts = unstable_cache(
    async () => {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                badge: 'NEW',
                createdAt: { gte: oneWeekAgo }
            },
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                image: true,
                badge: true,
                viewCount: true,
                createdAt: true,
                category: { select: { name: true, slug: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 8,
        })
        return products.map(product => ({
            ...product,
            badge: determineProductBadge(product)
        }))
    },
    ['new-products'],
    { revalidate: 60, tags: ['products'] }
)

export const getCachedProductCount = unstable_cache(
    async () => {
        return prisma.product.count({ where: { isActive: true } })
    },
    ['product-count-active'],
    { revalidate: 60, tags: ['products'] }
)

