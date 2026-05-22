import { prisma } from '@/lib/prisma'
import { getWibToday } from '@/lib/date'

export class AnalyticsRepository {
    async createEvent(data: {
        eventType: string
        productId?: string | null
        userAgent?: string | null
    }) {
        return await prisma.analytics.create({
            data: {
                eventType: data.eventType,
                productId: data.productId || null,
                userAgent: data.userAgent,
            },
        })
    }

    async incrementShopeeClicks(productId: string) {
        return await prisma.product.update({
            where: { id: productId },
            data: { shopeeClicks: { increment: 1 } },
        })
    }

    async getTodayEventsByType() {
        const today = getWibToday()

        return await prisma.analytics.groupBy({
            by: ['eventType'],
            where: { createdAt: { gte: today } },
            _count: { id: true },
        })
    }

    async getDashboardStats() {
        const today = getWibToday()

        const [
            totalProducts,
            totalCategories,
            topProducts,
            todayEvents,
            latestProducts,
        ] = await Promise.all([
            prisma.product.count({ where: { isActive: true } }),
            prisma.category.count(),
            prisma.product.findMany({
                where: { isActive: true },
                orderBy: { viewCount: 'desc' },
                take: 5,
                include: { category: true },
            }),
            prisma.analytics.groupBy({
                by: ['eventType'],
                where: { createdAt: { gte: today } },
                _count: { id: true },
            }),
            prisma.product.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { category: true },
            }),
        ])

        return { totalProducts, totalCategories, topProducts, todayEvents, latestProducts }
    }
}

export const analyticsRepository = new AnalyticsRepository()
