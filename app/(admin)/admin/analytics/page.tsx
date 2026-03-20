import { prisma } from '@/lib/prisma'
import { AnalyticsOverviewCards } from '@/components/admin/analytics/AnalyticsOverviewCards'
import { TopProductsTable } from '@/components/admin/analytics/TopProductsTable'
import { ConversionFunnel } from '@/components/admin/analytics/ConversionFunnel'
import { PeriodSelector } from '@/components/admin/analytics/PeriodSelector'
import { AnalyticsLineChart } from '@/components/admin/analytics/AnalyticsLineChart'
import { CategoryStatsChart } from '@/components/admin/analytics/CategoryStatsChart'

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ period?: string }>
}) {
    const { period = '7days' } = await searchParams

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    if (period === '30days') {
        last7Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (period === 'alltime') {
        last7Days = new Date(0) // beginning of time
    } else if (period === 'today') {
        last7Days = today
    }

    const [
        totalStats,
        todayStats,
        last7DaysStats,
        topProducts,
        eventsByDayRaw,
        categoryStats,
    ] = await Promise.all([
        // 1. Stats keseluruhan (all time)
        prisma.analytics.groupBy({
            by: ['eventType'],
            _count: { id: true },
        }),

        // 2. Stats hari ini
        prisma.analytics.groupBy({
            by: ['eventType'],
            where: { createdAt: { gte: today } },
            _count: { id: true },
        }),

        // 3. Stats periode yang dipilih
        prisma.analytics.groupBy({
            by: ['eventType'],
            where: { createdAt: { gte: last7Days } },
            _count: { id: true },
        }),

        // 4. Top 10 produk (sepanjang waktu)
        prisma.product.findMany({
            orderBy: { viewCount: 'desc' },
            take: 10,
            include: { category: true },
        }),

        // 5. Events per hari untuk periode yang dipilih
        prisma.$queryRaw<{ date: Date; eventType: string; count: bigint }[]>`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        "eventType",
        COUNT(*) as count
      FROM "Analytics"
      WHERE "createdAt" >= ${last7Days}
      GROUP BY DATE_TRUNC('day', "createdAt"), "eventType"
      ORDER BY date ASC
    `,

        // 6. Stats per kategori
        prisma.category.findMany({
            include: {
                products: {
                    select: {
                        viewCount: true,
                        shopeeClicks: true,
                        tokopediaClicks: true,
                    },
                },
            },
            orderBy: { name: 'asc' }
        }),
    ])

    // Convert BigInt counts from queryRaw to Number so they serialize nicely to client
    const eventsByDay = eventsByDayRaw.map((r: any) => ({
        ...r,
        count: Number(r.count)
    }))

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Analitik Website</h1>
                    <p className="text-brand-muted mt-1">
                        Data performa dan engagement pengunjung
                    </p>
                </div>

                <div className="flex gap-3">
                    <a
                        href="/api/admin/analytics/export"
                        className="flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-xl border border-brand-border text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-colors text-sm font-medium bg-white dark:bg-dark-surface"
                    >
                        Export CSV
                    </a>
                    <PeriodSelector defaultValue={period} />
                </div>
            </div>

            {/* Stats Overview */}
            <AnalyticsOverviewCards
                today={todayStats}
                last7Days={last7DaysStats}
                allTime={totalStats}
            />

            {/* Chart */}
            <AnalyticsLineChart data={eventsByDay} />

            {/* Grid: Top products and Categories */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <TopProductsTable products={topProducts} />
                <CategoryStatsChart categories={categoryStats} />
            </div>

            {/* Funnel */}
            <ConversionFunnel
                views={
                    totalStats.find((s: any) => s.eventType === 'view')?._count.id || 0
                }
                shopeeClicks={
                    totalStats.find((s: any) => s.eventType === 'shopee_click')?._count.id || 0
                }
                tokopediaClicks={
                    totalStats.find((s: any) => s.eventType === 'tokopedia_click')?._count.id || 0
                }
                waClicks={
                    totalStats.find((s: any) => s.eventType === 'wa_click')?._count.id || 0
                }
            />
        </div>
    )
}
