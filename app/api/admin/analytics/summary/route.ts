import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { captureError } from '@/lib/sentry-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [
            totalProducts,
            totalCategories,
            topProducts,
            todayEvents,
            latestProducts,
        ] = await Promise.all([
            // 1. Total produk aktif
            prisma.product.count({ where: { isActive: true } }),
            // 2. Total kategori
            prisma.category.count(),
            // 3. Top 5 produk berdasarkan viewCount
            prisma.product.findMany({
                where: { isActive: true },
                orderBy: { viewCount: 'desc' },
                take: 5,
                include: { category: true },
            }),
            // 4. Total events per eventType hari ini
            prisma.analytics.groupBy({
                by: ['eventType'],
                where: { createdAt: { gte: today } },
                _count: true,
            }),
            // 5. 5 produk terakhir ditambahkan
            prisma.product.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { category: true },
            }),
        ])

        // Format today events
        const todayStats: Record<string, number> = {
            view: 0,
            shopee_click: 0,
            tokopedia_click: 0,
            wa_click: 0,
        }
        for (const event of todayEvents) {
            todayStats[event.eventType] = event._count
        }

        return NextResponse.json({
            totalProducts,
            totalCategories,
            topProducts,
            todayStats,
            latestProducts,
        })
    } catch (error) {
        captureError(error, { endpoint: '/api/admin/analytics/summary' })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
