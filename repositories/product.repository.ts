import { prisma } from '@/lib/prisma'

export class ProductRepository {
    async findActiveProductsWithSearch(query: string, take: number = 50) {
        const where: any = { isActive: true }
        if (query) where.title = { contains: query, mode: 'insensitive' }

        return await prisma.product.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                image: true,
                badge: true,
                category: { select: { name: true, slug: true } },
            },
            orderBy: { createdAt: 'desc' },
            take,
        })
    }

    async incrementViewCount(id: string) {
        return await prisma.product.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        })
    }

    async getProductList(params: {
        query?: string
        categorySlug?: string
        badge?: string
        minPrice?: number
        maxPrice?: number
        sort: string
        page: number
        limit: number
    }) {
        const { query, categorySlug, badge, minPrice, maxPrice, sort, page, limit } = params

        const where: Record<string, unknown> = { isActive: true }
        if (query) where.title = { contains: query, mode: 'insensitive' }
        if (categorySlug) where.category = { slug: categorySlug }
        if (badge) where.badge = badge
        if (minPrice || maxPrice) {
            const priceFilter: Record<string, number> = {}
            if (minPrice) priceFilter.gte = minPrice
            if (maxPrice) priceFilter.lte = maxPrice
            where.price = priceFilter
        }

        const orderByMap: Record<string, Record<string, string>> = {
            newest: { createdAt: 'desc' },
            terbaru: { createdAt: 'desc' },
            'price-asc': { price: 'asc' },
            'harga-terendah': { price: 'asc' },
            'price-desc': { price: 'desc' },
            'harga-tertinggi': { price: 'desc' },
            popular: { viewCount: 'desc' },
            terlaris: { shopeeSold: 'desc' },
            'rating-tertinggi': { shopeeRating: 'desc' },
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    price: true,
                    originalPrice: true,
                    image: true,
                    badge: true,
                    viewCount: true,
                    shopeeRating: true,
                    shopeeSold: true,
                    category: { select: { name: true, slug: true } }
                },
                orderBy: orderByMap[sort] || orderByMap.newest,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ])

        return { products, total }
    }

    // === Admin CRUD ===

    async findAdminPaginated(params: {
        search?: string
        categoryId?: string
        isActive?: boolean | null
        page: number
        limit: number
    }) {
        const { search, categoryId, isActive, page, limit } = params
        const where: Record<string, unknown> = {}

        if (search) where.title = { contains: search, mode: 'insensitive' }
        if (categoryId) where.categoryId = categoryId
        if (isActive !== null && isActive !== undefined) where.isActive = isActive

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { category: true },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ])

        return { products, total, page, totalPages: Math.ceil(total / limit) }
    }

    async findById(id: string) {
        return await prisma.product.findUnique({
            where: { id },
            include: { category: true },
        })
    }

    async findBySlug(slug: string, excludeId?: string) {
        if (excludeId) {
            return await prisma.product.findFirst({ where: { slug, NOT: { id: excludeId } } })
        }
        return await prisma.product.findUnique({ where: { slug } })
    }

    async create(data: Record<string, unknown>) {
        return await prisma.product.create({
            data: data as any,
            include: { category: true },
        })
    }

    async update(id: string, data: Record<string, unknown>) {
        return await prisma.product.update({
            where: { id },
            data: data as any,
            include: { category: true },
        })
    }

    async delete(id: string) {
        return await prisma.product.delete({ where: { id } })
    }
}

export const productRepository = new ProductRepository()
