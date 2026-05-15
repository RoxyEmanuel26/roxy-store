import { prisma } from '@/lib/prisma'

export class CategoryRepository {
    async findAllCategories() {
        return await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        })
    }

    async findCategoryBySlug(slug: string) {
        return await prisma.category.findUnique({
            where: { slug },
            select: { id: true, name: true, slug: true, description: true },
        })
    }

    // === Admin ===

    async findAllWithCount() {
        return await prisma.category.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { products: true } } },
        })
    }

    async findByNameOrSlug(name: string, slug: string) {
        return await prisma.category.findFirst({
            where: { OR: [{ name }, { slug }] },
        })
    }

    async create(data: { name: string; slug: string; description?: string | null; icon?: string | null }) {
        return await prisma.category.create({ data })
    }
}

export const categoryRepository = new CategoryRepository()
