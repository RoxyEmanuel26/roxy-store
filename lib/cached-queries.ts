import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { determineProductBadge } from '@/lib/badge'

/**
 * Cache product by slug — dipakai di generateMetadata & ProductDetailPage
 * Dideklarasikan secara statis untuk menghindari memory leak.
 */
export const getCachedProductBySlug = unstable_cache(
    async (slug: string) => {
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
    ['product-slug'],
    { revalidate: 60, tags: ['products'] }
)

export const getCachedCategoryBySlug = unstable_cache(
    async (slug: string) => {
        return prisma.category.findUnique({ where: { slug } })
    },
    ['category-by-slug'],
    { revalidate: 3600, tags: ['categories'] }
)

export const getCachedCategories = unstable_cache(
    async () => {
        return prisma.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                _count: { select: { products: { where: { isActive: true } } } },
            },
            orderBy: { name: 'asc' },
        })
    },
    ['categories-list'],
    { revalidate: 3600, tags: ['categories'] }
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
            take: 10,
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
            take: 10,
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

export const getCachedPriceRange = unstable_cache(
    async () => {
        return prisma.product.aggregate({
            _min: { price: true },
            _max: { price: true },
            where: { isActive: true },
        })
    },
    ['price-range-agg'],
    { revalidate: 300, tags: ['products'] }
)

export const getCachedCategoryPriceRange = unstable_cache(
    async (categoryId: string) => {
        return prisma.product.aggregate({
            _min: { price: true },
            _max: { price: true },
            where: { isActive: true, categoryId },
        })
    },
    ['category-price-range-agg'],
    { revalidate: 300, tags: ['products'] }
)

export const getCachedRelatedProducts = unstable_cache(
    async (categoryId: string, productId: string) => {
        const products = await prisma.product.findMany({
            where: {
                categoryId,
                isActive: true,
                NOT: { id: productId },
            },
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                originalPrice: true,
                image: true,
                badge: true,
                createdAt: true,
                viewCount: true,
                shopeeRating: true,
                shopeeSold: true,
                category: { select: { name: true, slug: true } }
            },
            take: 5,
            orderBy: { viewCount: 'desc' },
        })
        return products.map(product => ({
            ...product,
            badge: determineProductBadge(product)
        }))
    },
    ['related-products'],
    { revalidate: 300, tags: ['products'] }
)
