import { prisma } from '@/lib/prisma'

export class SubcategoryRepository {
    async findAll() {
        return await prisma.subcategory.findMany({
            orderBy: { name: 'asc' },
            include: {
                category: {
                    select: {
                        name: true,
                        slug: true,
                    }
                }
            }
        })
    }

    async findAllWithCount() {
        return await prisma.subcategory.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                _count: { select: { products: true } },
            },
        })
    }

    async findById(id: string) {
        return await prisma.subcategory.findUnique({
            where: { id },
            include: { category: true }
        })
    }

    async findBySlug(categoryId: string, slug: string) {
        return await prisma.subcategory.findFirst({
            where: { categoryId, slug }
        })
    }

    async findByNameAndCategory(categoryId: string, name: string) {
        return await prisma.subcategory.findFirst({
            where: { categoryId, name }
        })
    }

    async findByCategory(categoryId: string) {
        return await prisma.subcategory.findMany({
            where: { categoryId },
            orderBy: { name: 'asc' }
        })
    }

    async findByNameOrSlug(categoryId: string, name: string, slug: string) {
        return await prisma.subcategory.findFirst({
            where: {
                categoryId,
                OR: [
                    { name: { equals: name, mode: 'insensitive' } },
                    { slug }
                ]
            }
        })
    }

    async create(data: { name: string; slug: string; categoryId: string; description?: string | null }) {
        return await prisma.subcategory.create({
            data,
            include: { category: true }
        })
    }

    async update(id: string, data: { name: string; slug: string; categoryId: string; description?: string | null }) {
        return await prisma.subcategory.update({
            where: { id },
            data,
            include: { category: true }
        })
    }

    async delete(id: string) {
        return await prisma.subcategory.delete({
            where: { id }
        })
    }
}

export const subcategoryRepository = new SubcategoryRepository()
